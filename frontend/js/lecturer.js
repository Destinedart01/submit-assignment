requireRole('lecturer');
const msg = document.getElementById('msg');
let currentQuestionAssignmentId = null;

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

// ---------- Assignment type toggle ----------
const typeSel = document.getElementById('assignmentType');
typeSel.addEventListener('change', () => {
  const isForm = typeSel.value === 'form';
  document.getElementById('fileTypeFields').style.display = isForm ? 'none' : 'block';
  document.getElementById('formTypeNote').style.display = isForm ? 'block' : 'none';
});
document.getElementById('qType').addEventListener('change', e => {
  document.getElementById('objectiveFields').style.display = e.target.value === 'objective' ? 'block' : 'none';
});

// ---------- Course units this lecturer teaches ----------
async function loadUnits() {
  const rows = await apiRequest('/lecturer/courses');
  fill(document.getElementById('unitSel'), rows, r => `${r.code} - ${r.title}`, 'Select course');
  fill(document.getElementById('resultUnitSel'), rows, r => `${r.code} - ${r.title}`, 'Select course');
}

// ---------- Assignments ----------
async function loadAssignments() {
  const rows = await apiRequest('/lecturer/assignments');
  document.getElementById('assignmentTable').innerHTML = rows.map(a => {
    const typeLabel = a.assignment_type === 'form' ? 'Interactive form' : 'File/text upload';
    const manageBtn = a.assignment_type === 'form'
      ? `<button class="primary" style="margin:0; padding:6px 10px;" onclick="openQuestionBuilder(${a.id}, '${a.title.replace(/'/g, "\\'")}')">Manage Questions</button>`
      : '';
    return row([a.title, `${a.course_code} - ${a.course_title}`, typeLabel, new Date(a.due_date).toLocaleString(), manageBtn]);
  }).join('');
  fill(document.getElementById('submissionAssignmentSel'),
    rows.filter(a => a.assignment_type === 'file'), r => r.title, 'Select assignment');
  fill(document.getElementById('theoryAssignmentSel'),
    rows.filter(a => a.assignment_type === 'form'), r => r.title, 'Select assignment');
}

document.getElementById('assignmentForm').addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('course_id', document.getElementById('unitSel').value);
  formData.append('title', document.getElementById('title').value);
  formData.append('instructions', document.getElementById('instructions').value);
  formData.append('due_date', document.getElementById('dueDate').value);
  formData.append('assignment_type', typeSel.value);
  if (typeSel.value === 'file') {
    formData.append('max_score', document.getElementById('maxScore').value || '');
    const file = document.getElementById('briefFile').files[0];
    if (file) formData.append('file', file);
  }

  try {
    const created = await apiRequest('/lecturer/assignments', { method: 'POST', body: formData });
    document.getElementById('assignmentForm').reset();
    document.getElementById('fileTypeFields').style.display = 'block';
    document.getElementById('formTypeNote').style.display = 'none';
    showMsg(msg, 'Assignment created.');
    await loadAssignments();
    if (created.assignment_type === 'form') {
      openQuestionBuilder(created.id, created.title);
    }
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Question builder ----------
function openQuestionBuilder(assignmentId, title) {
  currentQuestionAssignmentId = assignmentId;
  document.getElementById('questionBuilderTitle').textContent = 'Manage Questions: ' + title;
  document.getElementById('questionBuilder').style.display = 'block';
  document.getElementById('questionBuilder').scrollIntoView({ behavior: 'smooth' });
  loadQuestions();
}
async function loadQuestions() {
  const rows = await apiRequest(`/lecturer/assignments/${currentQuestionAssignmentId}/questions`);
  let total = 0;
  document.getElementById('questionTable').innerHTML = rows.map((q, i) => {
    total += Number(q.marks);
    return row([
      i + 1, q.question_text, q.question_type, q.marks,
      `<button style="margin:0; padding:5px 10px; background:var(--danger); color:#fff; border:none; border-radius:3px; cursor:pointer;" onclick="deleteQuestion(${q.id})">Delete</button>`
    ]);
  }).join('');
  document.getElementById('totalMarksNote').textContent = `Total marks so far: ${total}`;
}
document.getElementById('questionForm').addEventListener('submit', async e => {
  e.preventDefault();
  const qType = document.getElementById('qType').value;
  try {
    await apiRequest(`/lecturer/assignments/${currentQuestionAssignmentId}/questions`, {
      method: 'POST',
      body: {
        question_text: document.getElementById('qText').value,
        question_type: qType,
        option_a: document.getElementById('optA').value,
        option_b: document.getElementById('optB').value,
        option_c: document.getElementById('optC').value,
        option_d: document.getElementById('optD').value,
        correct_option: document.getElementById('correctOpt').value,
        marks: document.getElementById('qMarks').value
      }
    });
    document.getElementById('questionForm').reset();
    showMsg(msg, 'Question added.');
    loadQuestions();
    loadAssignments();
  } catch (err) { showMsg(msg, err.message, true); }
});
async function deleteQuestion(id) {
  if (!window.confirm('Delete this question?')) return;
  try {
    await apiRequest(`/lecturer/questions/${id}`, { method: 'DELETE' });
    showMsg(msg, 'Question removed.');
    loadQuestions();
    loadAssignments();
  } catch (err) { showMsg(msg, err.message, true); }
}

// ---------- File submissions & grading ----------
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
      <td>${s.file_name ? `<a href="/uploads/${s.file_path}" target="_blank">${s.file_name}</a>` : '-'}</td>
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

// ---------- Theory grading ----------
document.getElementById('theoryAssignmentSel').addEventListener('change', loadTheory);
async function loadTheory() {
  const id = document.getElementById('theoryAssignmentSel').value;
  if (!id) {
    document.getElementById('theoryTable').innerHTML = '';
    document.getElementById('formScoresTable').innerHTML = '';
    return;
  }
  const [answers, scores] = await Promise.all([
    apiRequest(`/lecturer/assignments/${id}/theory-answers`),
    apiRequest(`/lecturer/assignments/${id}/scores`)
  ]);

  document.getElementById('theoryTable').innerHTML = answers.map(a => `
    <tr>
      <td>${a.first_name} ${a.surname} (${a.student_no})</td>
      <td>${a.question_text}</td>
      <td>${a.answer_text || '-'}</td>
      <td>${a.max_marks}</td>
      <td>${a.graded ? a.score_awarded : `<input type="number" step="0.01" style="width:60px;" id="ans-${a.id}" max="${a.max_marks}">`}</td>
      <td>${a.graded ? '<span class="badge pass">Graded</span>' :
        `<button class="primary" style="margin:0; padding:5px 10px;" onclick="saveAnswerScore(${a.id}, '${id}')">Save</button>`}</td>
    </tr>`).join('');

  document.getElementById('formScoresTable').innerHTML = scores.map(s => row([
    `${s.first_name} ${s.surname} (${s.student_no})`,
    s.total_score,
    s.fully_graded ? '<span class="badge pass">Final</span>' : '<span class="badge">Pending theory grading</span>'
  ])).join('');
}
async function saveAnswerScore(answerId, assignmentId) {
  const value = document.getElementById(`ans-${answerId}`).value;
  try {
    await apiRequest(`/lecturer/answers/${answerId}/grade`, { method: 'PUT', body: { score_awarded: value } });
    showMsg(msg, 'Score saved.');
    document.getElementById('theoryAssignmentSel').value = assignmentId;
    loadTheory();
  } catch (err) { showMsg(msg, err.message, true); }
}

// ---------- Course results ----------
document.getElementById('resultForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const student = await apiRequest('/lecturer/students/lookup?student_no=' + encodeURIComponent(document.getElementById('resultStudentNo').value.trim()));
    await apiRequest('/lecturer/results', {
      method: 'POST',
      body: {
        student_id: student.id,
        course_id: document.getElementById('resultUnitSel').value,
        score: document.getElementById('courseworkScore').value
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
