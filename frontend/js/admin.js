requireRole('admin');
const msg = document.getElementById('msg');

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).style.display = 'block';
  });
});

function fill(sel, rows, labelFn, placeholder) {
  sel.innerHTML = (placeholder ? `<option value="">${placeholder}</option>` : '') +
    rows.map(r => `<option value="${r.id}">${labelFn(r)}</option>`).join('');
}
function esc(s) { return (s ?? '').toString().replace(/'/g, "\\'"); }

// Tracks which row (if any) is currently being edited, per entity key.
const editing = { faculty: null, department: null, program: null, year: null, semester: null, course: null, lecturer: null };

function setEditMode(entity, isEditing) {
  document.getElementById(entity + 'SubmitBtn').textContent = isEditing ? 'Save changes' : {
    faculty: 'Add faculty', department: 'Add department', program: 'Add program',
    year: 'Add academic year', semester: 'Add semester', course: 'Add course',
    lecturer: 'Register lecturer'
  }[entity];
  document.getElementById(entity + 'CancelBtn').style.display = isEditing ? 'inline-block' : 'none';
}
function cancelEdit(entity) {
  editing[entity] = null;
  setEditMode(entity, false);
  document.getElementById(entity + 'Form').reset();
  if (entity === 'lecturer') document.getElementById('lecUsername').disabled = false;
}

async function confirmDelete(label) {
  return window.confirm(`Delete this ${label}? This cannot be undone.`);
}

function row(cells) { return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`; }
function actionsCell(editFn, deleteFn) {
  return `<button class="primary" style="margin:0; padding:5px 10px;" onclick="${editFn}">Edit</button>
          <button style="margin:0 0 0 6px; padding:5px 10px; background:var(--danger); color:#fff; border:none; border-radius:3px; cursor:pointer;" onclick="${deleteFn}">Delete</button>`;
}

// ---------- Faculties ----------
async function loadFaculties() {
  const rows = await apiRequest('/admin/faculties');
  document.getElementById('facultyTable').innerHTML = rows.map(f => row([
    f.id, f.name, actionsCell(`editFaculty(${f.id}, '${esc(f.name)}')`, `deleteFaculty(${f.id})`)
  ])).join('');
  fill(document.getElementById('deptFacultySel'), rows, r => r.name, 'Select faculty');
  fill(document.getElementById('courseFacultySel'), rows, r => r.name, 'Select faculty');
  return rows;
}
function editFaculty(id, name) {
  editing.faculty = id;
  document.getElementById('facultyName').value = name;
  setEditMode('faculty', true);
  document.getElementById('tab-faculties').scrollIntoView({ behavior: 'smooth' });
}
async function deleteFaculty(id) {
  if (!(await confirmDelete('faculty'))) return;
  try {
    await apiRequest(`/admin/faculties/${id}`, { method: 'DELETE' });
    showMsg(msg, 'Faculty deleted.');
    loadFaculties();
  } catch (err) { showMsg(msg, err.message, true); }
}
document.getElementById('facultyForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('facultyName').value;
  try {
    if (editing.faculty) {
      await apiRequest(`/admin/faculties/${editing.faculty}`, { method: 'PUT', body: { name } });
      showMsg(msg, 'Faculty updated.');
      cancelEdit('faculty');
    } else {
      await apiRequest('/admin/faculties', { method: 'POST', body: { name } });
      document.getElementById('facultyForm').reset();
      showMsg(msg, 'Faculty added.');
    }
    loadFaculties();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Departments ----------
async function loadDepartments() {
  const rows = await apiRequest('/admin/departments');
  document.getElementById('departmentTable').innerHTML = rows.map(d => row([
    d.id, d.name, d.faculty_name,
    actionsCell(`editDepartment(${d.id}, '${esc(d.name)}', ${d.faculty_id})`, `deleteDepartment(${d.id})`)
  ])).join('');
  fill(document.getElementById('courseDeptSel'), rows, r => r.name, 'Select department');
  return rows;
}
function editDepartment(id, name, facultyId) {
  editing.department = id;
  document.getElementById('deptName').value = name;
  document.getElementById('deptFacultySel').value = facultyId;
  setEditMode('department', true);
  document.getElementById('tab-departments').scrollIntoView({ behavior: 'smooth' });
}
async function deleteDepartment(id) {
  if (!(await confirmDelete('department'))) return;
  try {
    await apiRequest(`/admin/departments/${id}`, { method: 'DELETE' });
    showMsg(msg, 'Department deleted.');
    loadDepartments();
  } catch (err) { showMsg(msg, err.message, true); }
}
document.getElementById('departmentForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = { faculty_id: document.getElementById('deptFacultySel').value, name: document.getElementById('deptName').value };
  try {
    if (editing.department) {
      await apiRequest(`/admin/departments/${editing.department}`, { method: 'PUT', body });
      showMsg(msg, 'Department updated.');
      cancelEdit('department');
    } else {
      await apiRequest('/admin/departments', { method: 'POST', body });
      document.getElementById('departmentForm').reset();
      showMsg(msg, 'Department added.');
    }
    loadDepartments();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Programs ----------
async function loadPrograms() {
  const rows = await apiRequest('/admin/programs');
  document.getElementById('programTable').innerHTML = rows.map(p => row([
    p.id, p.name, actionsCell(`editProgram(${p.id}, '${esc(p.name)}')`, `deleteProgram(${p.id})`)
  ])).join('');
}
function editProgram(id, name) {
  editing.program = id;
  document.getElementById('programName').value = name;
  setEditMode('program', true);
  document.getElementById('tab-programs').scrollIntoView({ behavior: 'smooth' });
}
async function deleteProgram(id) {
  if (!(await confirmDelete('program'))) return;
  try {
    await apiRequest(`/admin/programs/${id}`, { method: 'DELETE' });
    showMsg(msg, 'Program deleted.');
    loadPrograms();
  } catch (err) { showMsg(msg, err.message, true); }
}
document.getElementById('programForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('programName').value;
  try {
    if (editing.program) {
      await apiRequest(`/admin/programs/${editing.program}`, { method: 'PUT', body: { name } });
      showMsg(msg, 'Program updated.');
      cancelEdit('program');
    } else {
      await apiRequest('/admin/programs', { method: 'POST', body: { name } });
      document.getElementById('programForm').reset();
      showMsg(msg, 'Program added.');
    }
    loadPrograms();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Academic years & semesters ----------
async function loadYears() {
  const rows = await apiRequest('/admin/academic-years');
  document.getElementById('yearTable').innerHTML = rows.map(y => row([
    y.id, y.name, y.start_date || '', y.end_date || '',
    actionsCell(`editYear(${y.id}, '${esc(y.name)}', '${y.start_date || ''}', '${y.end_date || ''}')`, `deleteYear(${y.id})`)
  ])).join('');
  return rows;
}
function editYear(id, name, start, end) {
  editing.year = id;
  document.getElementById('yearName').value = name;
  document.getElementById('yearStart').value = start;
  document.getElementById('yearEnd').value = end;
  setEditMode('year', true);
  document.getElementById('tab-calendar').scrollIntoView({ behavior: 'smooth' });
}
async function deleteYear(id) {
  if (!(await confirmDelete('academic year'))) return;
  try {
    await apiRequest(`/admin/academic-years/${id}`, { method: 'DELETE' });
    showMsg(msg, 'Academic year deleted.');
    loadYears();
  } catch (err) { showMsg(msg, err.message, true); }
}
document.getElementById('yearForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    name: document.getElementById('yearName').value,
    start_date: document.getElementById('yearStart').value || null,
    end_date: document.getElementById('yearEnd').value || null
  };
  try {
    if (editing.year) {
      await apiRequest(`/admin/academic-years/${editing.year}`, { method: 'PUT', body });
      showMsg(msg, 'Academic year updated.');
      cancelEdit('year');
    } else {
      await apiRequest('/admin/academic-years', { method: 'POST', body });
      document.getElementById('yearForm').reset();
      showMsg(msg, 'Academic year added.');
    }
    loadYears();
  } catch (err) { showMsg(msg, err.message, true); }
});

async function loadSemesters() {
  const rows = await apiRequest('/admin/semesters');
  document.getElementById('semesterTable').innerHTML = rows.map(s => row([
    s.id, s.name, actionsCell(`editSemester(${s.id}, '${esc(s.name)}')`, `deleteSemester(${s.id})`)
  ])).join('');
  fill(document.getElementById('courseSemesterSel'), rows, r => r.name, 'Select semester');
  return rows;
}
function editSemester(id, name) {
  editing.semester = id;
  document.getElementById('semesterName').value = name;
  setEditMode('semester', true);
  document.getElementById('tab-calendar').scrollIntoView({ behavior: 'smooth' });
}
async function deleteSemester(id) {
  if (!(await confirmDelete('semester'))) return;
  try {
    await apiRequest(`/admin/semesters/${id}`, { method: 'DELETE' });
    showMsg(msg, 'Semester deleted.');
    loadSemesters();
  } catch (err) { showMsg(msg, err.message, true); }
}
document.getElementById('semesterForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('semesterName').value;
  try {
    if (editing.semester) {
      await apiRequest(`/admin/semesters/${editing.semester}`, { method: 'PUT', body: { name } });
      showMsg(msg, 'Semester updated.');
      cancelEdit('semester');
    } else {
      await apiRequest('/admin/semesters', { method: 'POST', body: { name } });
      document.getElementById('semesterForm').reset();
      showMsg(msg, 'Semester added.');
    }
    loadSemesters();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Courses (faculty + department + code + title + semester) ----------
async function loadCourses() {
  const rows = await apiRequest('/admin/courses');
  document.getElementById('courseTable').innerHTML = rows.map(c => row([
    c.code, c.title, c.faculty_name || '-', c.department_name || '-', c.semester_name || '-',
    actionsCell(
      `editCourse(${c.id}, '${esc(c.code)}', '${esc(c.title)}', ${c.faculty_id || 'null'}, ${c.department_id || 'null'}, ${c.semester_id || 'null'})`,
      `deleteCourse(${c.id})`
    )
  ])).join('');
  fill(document.getElementById('teachesCourseSel'), rows, r => `${r.code} - ${r.title}`, 'Select course');
  return rows;
}
function editCourse(id, code, title, facultyId, deptId, semesterId) {
  editing.course = id;
  document.getElementById('courseCode').value = code;
  document.getElementById('courseTitle').value = title;
  if (facultyId) document.getElementById('courseFacultySel').value = facultyId;
  if (deptId) document.getElementById('courseDeptSel').value = deptId;
  if (semesterId) document.getElementById('courseSemesterSel').value = semesterId;
  setEditMode('course', true);
  document.getElementById('tab-courses').scrollIntoView({ behavior: 'smooth' });
}
async function deleteCourse(id) {
  if (!(await confirmDelete('course'))) return;
  try {
    await apiRequest(`/admin/courses/${id}`, { method: 'DELETE' });
    showMsg(msg, 'Course deleted.');
    loadCourses();
  } catch (err) { showMsg(msg, err.message, true); }
}
document.getElementById('courseForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    faculty_id: document.getElementById('courseFacultySel').value || null,
    department_id: document.getElementById('courseDeptSel').value || null,
    code: document.getElementById('courseCode').value,
    title: document.getElementById('courseTitle').value,
    semester_id: document.getElementById('courseSemesterSel').value || null
  };
  try {
    if (editing.course) {
      await apiRequest(`/admin/courses/${editing.course}`, { method: 'PUT', body });
      showMsg(msg, 'Course updated.');
      cancelEdit('course');
    } else {
      await apiRequest('/admin/courses', { method: 'POST', body });
      document.getElementById('courseForm').reset();
      showMsg(msg, 'Course added.');
    }
    loadCourses();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Lecturers ----------
async function loadLecturers() {
  const rows = await apiRequest('/admin/lecturers');
  document.getElementById('lecturerTable').innerHTML = rows.map(l => row([
    l.id, l.name, l.username,
    actionsCell(`editLecturer(${l.id}, '${esc(l.name)}', '${esc(l.status)}')`, `deleteLecturer(${l.id})`)
  ])).join('');
  fill(document.getElementById('teachesLecturerSel'), rows, r => `${r.name} (${r.username})`, 'Select lecturer');
  return rows;
}
function editLecturer(id, name, status) {
  editing.lecturer = id;
  document.getElementById('lecName').value = name;
  document.getElementById('lecStatus').value = status || 'active';
  document.getElementById('lecUsername').disabled = true;
  document.getElementById('lecPassword').placeholder = 'Leave blank to keep unchanged';
  setEditMode('lecturer', true);
  document.getElementById('tab-lecturers').scrollIntoView({ behavior: 'smooth' });
}
async function deleteLecturer(id) {
  if (!(await confirmDelete('lecturer'))) return;
  try {
    await apiRequest(`/admin/lecturers/${id}`, { method: 'DELETE' });
    showMsg(msg, 'Lecturer deleted.');
    loadLecturers();
  } catch (err) { showMsg(msg, err.message, true); }
}
document.getElementById('lecturerForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    if (editing.lecturer) {
      await apiRequest(`/admin/lecturers/${editing.lecturer}`, {
        method: 'PUT',
        body: { name: document.getElementById('lecName').value, status: document.getElementById('lecStatus').value }
      });
      showMsg(msg, 'Lecturer updated.');
      document.getElementById('lecUsername').disabled = false;
      cancelEdit('lecturer');
    } else {
      const password = document.getElementById('lecPassword').value;
      if (!password) { showMsg(msg, 'Password is required when registering a new lecturer.', true); return; }
      await apiRequest('/admin/lecturers', {
        method: 'POST',
        body: { name: document.getElementById('lecName').value, username: document.getElementById('lecUsername').value, password }
      });
      document.getElementById('lecturerForm').reset();
      showMsg(msg, 'Lecturer registered.');
    }
    loadLecturers();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Assign teaches ----------
async function loadTeaches() {
  const rows = await apiRequest('/admin/teaches');
  document.getElementById('teachesTable').innerHTML = rows.map(t => row([
    t.lecturer_name, `${t.course_code} - ${t.course_title}`,
    `<button style="margin:0; padding:5px 10px; background:var(--danger); color:#fff; border:none; border-radius:3px; cursor:pointer;" onclick="deleteTeaches(${t.id})">Remove</button>`
  ])).join('');
}
async function deleteTeaches(id) {
  if (!(await confirmDelete('assignment'))) return;
  try {
    await apiRequest(`/admin/teaches/${id}`, { method: 'DELETE' });
    showMsg(msg, 'Assignment removed.');
    loadTeaches();
  } catch (err) { showMsg(msg, err.message, true); }
}
document.getElementById('teachesForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/admin/teaches', {
      method: 'POST',
      body: {
        staff_id: document.getElementById('teachesLecturerSel').value,
        course_id: document.getElementById('teachesCourseSel').value
      }
    });
    showMsg(msg, 'Lecturer assigned to course.');
    loadTeaches();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Students ----------
async function loadStudents() {
  const rows = await apiRequest('/admin/students');
  document.getElementById('studentTable').innerHTML = rows.map(s => row([
    s.student_no, `${s.first_name} ${s.surname}`, s.faculty_name || '-', s.department_name || '-',
    `<button style="margin:0; padding:5px 10px; background:var(--danger); color:#fff; border:none; border-radius:3px; cursor:pointer;" onclick="deleteStudent(${s.id})">Delete</button>`
  ])).join('');
}
async function deleteStudent(id) {
  if (!(await confirmDelete('student'))) return;
  try {
    await apiRequest(`/admin/students/${id}`, { method: 'DELETE' });
    showMsg(msg, 'Student deleted.');
    loadStudents();
  } catch (err) { showMsg(msg, err.message, true); }
}

// ---------- Initial load ----------
(async function init() {
  await loadFaculties();
  await loadDepartments();
  await loadPrograms();
  await loadYears();
  await loadSemesters();
  await loadCourses();
  await loadLecturers();
  await loadTeaches();
  await loadStudents();
})();
