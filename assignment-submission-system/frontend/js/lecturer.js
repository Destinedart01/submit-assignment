requireRole('lecturer');
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
function row(cells) { return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`; }

// ---------- Course units this lecturer teaches ----------
async function loadUnits() {
  const rows = await apiRequest('/lecturer/course-units');
  fill(document.getElementById('unitSel'), rows, r => `${r.course_code} - ${r.name}`, 'Select course unit');
  fill(document.getElementById('resultUnitSel'), rows, r => `${r.course_code} - ${r.name}`, 'Select course unit');
}

// ---------- Assignments ----------
async function loadAssignments() {
  const rows = await apiRequest('/lecturer/assignments');
  document.getElementById('assignmentTable').innerHTML =
    rows.map(a => row([a.title, a.course_unit_name, new Date(a.due_date).toLocaleString()])).join('');
  fill(document.getElementById('submissionAssignmentSel'), rows, r => r.title, 'Select assignment');
}
document.getElementById('assignmentForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await apiRequest('/lecturer/assignments', {
      method: 'POST',
      body: {
        course_unit_id: document.getElementById('unitSel').value,
        title: document.getElementById('title').value,
        instructions: document.getElementById('instructions').value,
        due_date: document.getElementById('dueDate').value
      }
    });
    document.getElementById('assignmentForm').reset();
    showMsg(msg, 'Assignment created.');
    loadAssignments();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Submissions & grading ----------
document.getElementById('submissionAssignmentSel').addEventListener('change', loadSubmissions);
async function loadSubmissions() {
  const id = document.getElementById('submissionAssignmentSel').value;
  if (!id) { document.getElementById('submissionTable').innerHTML = ''; return; }
  const rows = await apiRequest(`/lecturer/assignments/${id}/submissions`);
  document.getElementById('submissionTable').innerHTML = rows.map(s => `
    <tr>
      <td>${s.first_name} ${s.surname}</td>
      <td>${s.student_no}</td>
      <td>${s.text_content || '-'}</td>
      <td>${s.file_name ? s.file_name : '-'}</td>
      <td>${s.grade ?? '-'}</td>
      <td>
        <input type="number" step="0.01" style="width:70px;" id="grade-${s.id}" placeholder="score">
        <button class="primary" style="margin:0; padding:6px 10px;" onclick="saveGrade(${s.id})">Save</button>
      </td>
    </tr>`).join('');
}
async function saveGrade(submissionId) {
  const value = document.getElementById(`grade-${submissionId}`).value;
  try {
    await apiRequest(`/lecturer/submissions/${submissionId}/grade`, { method: 'PUT', body: { grade: value } });
    showMsg(msg, 'Grade saved.');
    loadSubmissions();
  } catch (err) { showMsg(msg, err.message, true); }
}

// ---------- Results ----------
document.getElementById('resultForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const student = await apiRequest('/lecturer/students/lookup?student_no=' + encodeURIComponent(document.getElementById('resultStudentNo').value.trim()));
    await apiRequest('/lecturer/results', {
      method: 'POST',
      body: {
        student_id: student.id,
        course_unit_id: document.getElementById('resultUnitSel').value,
        coursework_score: document.getElementById('courseworkScore').value,
        exam_score: document.getElementById('examScore').value
      }
    });
    document.getElementById('resultForm').reset();
    showMsg(msg, `Result saved for ${student.first_name} ${student.surname}.`);
  } catch (err) { showMsg(msg, err.message, true); }
});

(async function init() {
  await loadUnits();
  await loadAssignments();
})();
