requireRole('admin');
const msg = document.getElementById('msg');

// ---------- Tabs ----------
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
function row(cells) { return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`; }

// ---------- Faculties ----------
async function loadFaculties() {
  const rows = await apiRequest('/admin/faculties');
  document.getElementById('facultyTable').innerHTML = rows.map(f => row([f.id, f.name])).join('');
  fill(document.getElementById('deptFacultySel'), rows, r => r.name, 'Select faculty');
  fill(document.getElementById('courseFacultySel'), rows, r => r.name, 'Select faculty');
  return rows;
}
document.getElementById('facultyForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/admin/faculties', { method: 'POST', body: { name: document.getElementById('facultyName').value } });
    document.getElementById('facultyName').value = '';
    showMsg(msg, 'Faculty added.');
    loadFaculties();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Departments ----------
async function loadDepartments() {
  const rows = await apiRequest('/admin/departments');
  document.getElementById('departmentTable').innerHTML =
    rows.map(d => row([d.id, d.name, d.faculty_name])).join('');
  fill(document.getElementById('courseDeptSel'), rows, r => r.name, 'Select department');
  return rows;
}
document.getElementById('departmentForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/admin/departments', {
      method: 'POST',
      body: { faculty_id: document.getElementById('deptFacultySel').value, name: document.getElementById('deptName').value }
    });
    document.getElementById('deptName').value = '';
    showMsg(msg, 'Department added.');
    loadDepartments();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Programs ----------
async function loadPrograms() {
  const rows = await apiRequest('/admin/programs');
  document.getElementById('programTable').innerHTML = rows.map(p => row([p.id, p.name])).join('');
}
document.getElementById('programForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/admin/programs', { method: 'POST', body: { name: document.getElementById('programName').value } });
    document.getElementById('programName').value = '';
    showMsg(msg, 'Program added.');
    loadPrograms();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Academic years & semesters ----------
async function loadYears() {
  const rows = await apiRequest('/admin/academic-years');
  document.getElementById('yearTable').innerHTML = rows.map(y => row([y.id, y.name, y.start_date || '', y.end_date || ''])).join('');
  fill(document.getElementById('deadlineYearSel'), rows, r => r.name, 'Select year');
  return rows;
}
document.getElementById('yearForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/admin/academic-years', {
      method: 'POST',
      body: {
        name: document.getElementById('yearName').value,
        start_date: document.getElementById('yearStart').value || null,
        end_date: document.getElementById('yearEnd').value || null
      }
    });
    document.getElementById('yearForm').reset();
    showMsg(msg, 'Academic year added.');
    loadYears();
  } catch (err) { showMsg(msg, err.message, true); }
});

async function loadSemesters() {
  const rows = await apiRequest('/admin/semesters');
  document.getElementById('semesterTable').innerHTML = rows.map(s => row([s.id, s.name])).join('');
  fill(document.getElementById('unitSemesterSel'), rows, r => r.name, 'Select semester');
  fill(document.getElementById('deadlineSemesterSel'), rows, r => r.name, 'Select semester');
  return rows;
}
document.getElementById('semesterForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/admin/semesters', { method: 'POST', body: { name: document.getElementById('semesterName').value } });
    document.getElementById('semesterName').value = '';
    showMsg(msg, 'Semester added.');
    loadSemesters();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Courses & units ----------
async function loadCourses() {
  const rows = await apiRequest('/admin/courses');
  document.getElementById('courseTable').innerHTML =
    rows.map(c => row([c.code, c.name, c.faculty_name || '-', c.department_name || '-'])).join('');
  fill(document.getElementById('unitCourseSel'), rows, r => `${r.code} - ${r.name}`, 'Select course');
  return rows;
}
document.getElementById('courseForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/admin/courses', {
      method: 'POST',
      body: {
        faculty_id: document.getElementById('courseFacultySel').value || null,
        department_id: document.getElementById('courseDeptSel').value || null,
        code: document.getElementById('courseCode').value,
        name: document.getElementById('courseName').value,
        duration: document.getElementById('courseDuration').value,
        tuition: document.getElementById('courseTuition').value || 0
      }
    });
    document.getElementById('courseForm').reset();
    showMsg(msg, 'Course added.');
    loadCourses();
  } catch (err) { showMsg(msg, err.message, true); }
});

async function loadUnits() {
  const rows = await apiRequest('/admin/course-units');
  document.getElementById('unitTable').innerHTML =
    rows.map(u => row([u.id, u.name, u.course_code, u.semester_name])).join('');
  fill(document.getElementById('teachesUnitSel'), rows, r => `${r.course_code} - ${r.name}`, 'Select course unit');
  return rows;
}
document.getElementById('unitForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/admin/course-units', {
      method: 'POST',
      body: {
        course_id: document.getElementById('unitCourseSel').value,
        semester_id: document.getElementById('unitSemesterSel').value,
        name: document.getElementById('unitName').value
      }
    });
    document.getElementById('unitName').value = '';
    showMsg(msg, 'Course unit added.');
    loadUnits();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Lecturers ----------
async function loadLecturers() {
  const rows = await apiRequest('/admin/lecturers');
  document.getElementById('lecturerTable').innerHTML =
    rows.map(l => row([l.id, l.name, l.username])).join('');
  fill(document.getElementById('teachesLecturerSel'), rows, r => `${r.name} (${r.username})`, 'Select lecturer');
  return rows;
}
document.getElementById('lecturerForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/admin/lecturers', {
      method: 'POST',
      body: {
        name: document.getElementById('lecName').value,
        username: document.getElementById('lecUsername').value,
        password: document.getElementById('lecPassword').value
      }
    });
    document.getElementById('lecturerForm').reset();
    showMsg(msg, 'Lecturer registered.');
    loadLecturers();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Assign teaches ----------
document.getElementById('teachesForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/admin/teaches', {
      method: 'POST',
      body: {
        staff_id: document.getElementById('teachesLecturerSel').value,
        course_unit_id: document.getElementById('teachesUnitSel').value
      }
    });
    showMsg(msg, 'Lecturer assigned to course unit.');
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Students ----------
async function loadStudents() {
  const rows = await apiRequest('/admin/students');
  document.getElementById('studentTable').innerHTML =
    rows.map(s => row([s.student_no, `${s.first_name} ${s.surname}`, s.faculty_name || '-', s.department_name || '-'])).join('');
}

// ---------- Deadlines & pass mark ----------
document.getElementById('deadlineForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/admin/registration-deadlines', {
      method: 'POST',
      body: {
        academic_year_id: document.getElementById('deadlineYearSel').value,
        semester_id: document.getElementById('deadlineSemesterSel').value,
        deadline_date: document.getElementById('deadlineDate').value
      }
    });
    showMsg(msg, 'Deadline set.');
  } catch (err) { showMsg(msg, err.message, true); }
});
document.getElementById('passMarkForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/admin/pass-marks', {
      method: 'POST',
      body: { pass_mark: document.getElementById('passMarkValue').value }
    });
    showMsg(msg, 'Pass mark updated.');
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Initial load ----------
(async function init() {
  await loadFaculties();
  await loadDepartments();
  await loadPrograms();
  await loadYears();
  await loadSemesters();
  await loadCourses();
  await loadUnits();
  await loadLecturers();
  await loadStudents();
})();
