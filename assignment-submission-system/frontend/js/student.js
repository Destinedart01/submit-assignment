requireRole('student');
const msg = document.getElementById('msg');
let currentAssignmentId = null;

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

// ---------- Registration ----------
async function loadRegLookups() {
  const [years, semesters, units] = await Promise.all([
    apiRequest('/public/academic-years'),
    apiRequest('/public/semesters'),
    apiRequest('/student/course-units')
  ]);
  fill(document.getElementById('regYearSel'), years, r => r.name, 'Select year');
  fill(document.getElementById('regSemesterSel'), semesters, r => r.name, 'Select semester');
  fill(document.getElementById('regUnitSel'), units, r => `${r.course_code} - ${r.name}`, 'Select course unit');
}
document.getElementById('registerCourseForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/student/register-course', {
      method: 'POST',
      body: {
        academic_year_id: document.getElementById('regYearSel').value,
        semester_id: document.getElementById('regSemesterSel').value,
        course_unit_id: document.getElementById('regUnitSel').value
      }
    });
    showMsg(msg, 'Registered successfully.');
    loadMyCourses();
  } catch (err) { showMsg(msg, err.message, true); }
});

async function loadMyCourses() {
  const rows = await apiRequest('/student/my-courses');
  document.getElementById('myCoursesTable').innerHTML =
    rows.map(r => row([r.course_code, r.course_unit_name, r.status])).join('');
}

// ---------- Assignments ----------
async function loadAssignments() {
  const rows = await apiRequest('/student/assignments');
  document.getElementById('assignmentTable').innerHTML = rows.map(a => `
    <tr>
      <td>${a.title}</td>
      <td>${a.course_unit_name}</td>
      <td>${new Date(a.due_date).toLocaleString()}</td>
      <td><button class="primary" style="margin:0; padding:6px 10px;" onclick="openSubmit(${a.id}, '${a.title.replace(/'/g, "\\'")}')">Submit</button></td>
    </tr>`).join('');
}
function openSubmit(id, title) {
  currentAssignmentId = id;
  document.getElementById('submitTitle').textContent = 'Submit: ' + title;
  document.getElementById('submitBox').style.display = 'block';
  document.getElementById('submitBox').scrollIntoView({ behavior: 'smooth' });
}
document.getElementById('submitForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentAssignmentId) return;

  const text = document.getElementById('textContent').value.trim();
  const file = document.getElementById('fileInput').files[0];

  if (!text && !file) {
    showMsg(msg, 'Provide a text answer or a file.', true);
    return;
  }

  const formData = new FormData();
  if (text) formData.append('text_content', text);
  if (file) formData.append('file', file);

  try {
    await apiRequest(`/student/assignments/${currentAssignmentId}/submit`, { method: 'POST', body: formData });
    showMsg(msg, 'Assignment submitted.');
    document.getElementById('submitForm').reset();
    document.getElementById('submitBox').style.display = 'none';
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Results ----------
async function loadResults() {
  const rows = await apiRequest('/student/results');
  document.getElementById('resultTable').innerHTML =
    rows.map(r => row([r.course_unit_name, r.coursework_score, r.exam_score, r.total_score, r.grade])).join('');
}

(async function init() {
  await loadRegLookups();
  await loadMyCourses();
  await loadAssignments();
  await loadResults();
})();
