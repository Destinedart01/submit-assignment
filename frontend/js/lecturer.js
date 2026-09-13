requireRole('lecturer');
const msg = document.getElementById('msg');
let stagedQuestions = [];

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
  document.getElementById('createAssignmentBtn').style.display = isForm ? 'none' : 'inline-block';
  document.getElementById('continueToQuestionsBtn').style.display = isForm ? 'inline-block' : 'none';
});
document.getElementById('qType').addEventListener('change', e => {
  document.getElementById('objectiveFields').style.display = e.target.value === 'objective' ? 'block' : 'none';
});

// ---------- Courses this lecturer teaches ----------
async function loadUnits() {
  const rows = await apiRequest('/lecturer/courses');
  fill(document.getElementById('unitSel'), rows, r => `${r.code} - ${r.title}`, 'Select course');
  fill(document.getElementById('resultUnitSel'), rows, r => `${r.code} - ${r.title}`, 'Select course');
}

// ---------- Assignments list ----------
async function loadAssignments() {
  const rows = await apiRequest('/lecturer/assignments');
  document.getElementById('assignmentTable').innerHTML = rows.map(a => {
    const typeLabel = a.assignment_type === 'form' ? 'Interactive form' : 'File/text upload';
    const viewBtn = `<button class="primary" style="margin:0; padding:6px 10px;" onclick="viewAssignment(${a.id})">View</button>`;
    return row([a.title, `${a.course_code} - ${a.course_title}`, typeLabel, new Date(a.due_date).toLocaleString(), viewBtn]);
  }).join('');
  fill(document.getElementById('submissionAssignmentSel'),
    rows.filter(a => a.assignment_type === 'file'), r => r.title, 'Select assignment');
  fill(document.getElementById('theoryAssignmentSel'),
    rows.filter(a => a.assignment_type === 'form'), r => r.title, 'Select assignment');
}

// ---------- Step 1: file/text assignments create immediately (unchanged) ----------
document.getElementById('assignmentForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (typeSel.value === 'form') return; // form-type goes through the "Continue" flow instead

  const formData = new FormData();
  formData.append('course_id', document.getElementById('unitSel').value);
  formData.append('title', document.getElementById('title').value);
  formData.append('instructions', document.getElementById('instructions').value);
  formData.append('due_date', document.getElementById('dueDate').value);
  formData.append('assignment_type', 'file');
  formData.append('max_score', document.getElementById('maxScore').value || '');
  const file = document.getElementById('briefFile').files[0];
  if (file) formData.append('file', file);

  try {
    await apiRequest('/lecturer/assignments', { method: 'POST', body: formData });
    document.getElementById('assignmentForm').reset();
    document.getElementById('fileTypeFields').style.display = 'block';
    showMsg(msg, 'Assignment created.');
    await loadAssignments();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Step 2 (form type only): continue to set every question before saving anything ----------
document.getElementById('continueToQuestionsBtn').addEventListener('click', () => {
  const course = document.getElementById('unitSel').value;
  const title = document.getElementById('title').value.trim();
  const dueDate = document.getElementById('dueDate').value;
  if (!course || !title || !dueDate) {
    showMsg(msg, 'Fill in course, title, and due date first.', true);
    return;
  }
  stagedQuestions = [];
  renderStagedQuestions();
  document.getElementById('stagingAssignmentTitle').textContent = title;
  document.getElementById('createStep').style.display = 'none';
  document.getElementById('questionStaging').style.display = 'block';
  document.getElementById('questionStaging').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('cancelStagingBtn').addEventListener('click', () => {
  stagedQuestions = [];
  document.getElementById('questionStaging').style.display = 'none';
  document.getElementById('createStep').style.display = 'block';
});

function renderStagedQuestions() {
  let total = 0;
  document.getElementById('stagedQuestionTable').innerHTML = stagedQuestions.map((q, i) => {
    total += Number(q.marks);
    return row([
      i + 1, q.question_text, q.question_type, q.marks,
      `<button style="margin:0; padding:5px 10px; background:var(--danger); color:#fff; border:none; border-radius:3px; cursor:pointer;" onclick="removeStagedQuestion(${i})">Remove</button>`
    ]);
  }).join('');
  document.getElementById('totalMarksNote').textContent = `Total marks so far: ${total}`;
}
function removeStagedQuestion(index) {
  stagedQuestions.splice(index, 1);
  renderStagedQuestions();
}

document.getElementById('questionForm').addEventListener('submit', e => {
  e.preventDefault();
  const qType = document.getElementById('qType').value;
  const qText = document.getElementById('qText').value.trim();
  const qMarks = document.getElementById('qMarks').value || 1;
  if (!qText) { showMsg(msg, 'Enter the question text.', true); return; }

  stagedQuestions.push({
    question_text: qText,
    question_type: qType,
    option_a: document.getElementById('optA').value,
    option_b: document.getElementById('optB').value,
    option_c: document.getElementById('optC').value,
    option_d: document.getElementById('optD').value,
    correct_option: document.getElementById('correctOpt').value,
    marks: qMarks
  });
  renderStagedQuestions();

  document.getElementById('qText').value = '';
  document.getElementById('optA').value = '';
  document.getElementById('optB').value = '';
  document.getElementById('optC').value = '';
  document.getElementById('optD').value = '';
  document.getElementById('qMarks').value = 1;
  document.getElementById('qText').focus();
});

document.getElementById('finishCreateBtn').addEventListener('click', async () => {
  if (stagedQuestions.length === 0) {
    showMsg(msg, 'Add at least one question before finishing.', true);
    return;
  }
  try {
    const created = await apiRequest('/lecturer/assignments', {
      method: 'POST',
      body: {
        course_id: document.getElementById('unitSel').value,
        title: document.getElementById('title').value,
        instructions: document.getElementById('instructions').value,
        due_date: document.getElementById('dueDate').value,
        assignment_type: 'form'
      }
    });
    for (const q of stagedQuestions) {
      await apiRequest(`/lecturer/assignments/${created.id}/questions`, { method: 'POST', body: q });
    }

    const questionCount = stagedQuestions.length;
    stagedQuestions = [];
    document.getElementById('assignmentForm').reset();
    document.getElementById('fileTypeFields').style.display = 'block';
    document.getElementById('createAssignmentBtn').style.display = 'inline-block';
    document.getElementById('continueToQuestionsBtn').style.display = 'none';
    document.getElementById('questionStaging').style.display = 'none';
    document.getElementById('createStep').style.display = 'block';

    showMsg(msg, `Assignment created with ${questionCount} question${questionCount === 1 ? '' : 's'}.`);
    await loadAssignments();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Full-text / assignment-view modal ----------
const textCache = {};
function renderTextCell(fullText, cacheKey, title) {
  if (!fullText) return '-';
  textCache[cacheKey] = { title, text: fullText };
  const preview = fullText.length > 45 ? fullText.slice(0, 45) + '…' : fullText;
  const needsButton = fullText.length > 45 || fullText.includes('\n');
  return `<span class="text-preview" title="${fullText.replace(/"/g, '&quot;')}">${preview}</span>` +
    (needsButton ? `<button type="button" class="view-text-btn" onclick="openTextModal('${cacheKey}')">View full</button>` : '');
}
function openTextModal(cacheKey) {
  const entry = textCache[cacheKey];
  if (!entry) return;
  document.getElementById('textModalTitle').textContent = entry.title;
  document.getElementById('textModalBody').textContent = entry.text;
  document.getElementById('textModal').style.display = 'flex';
}
function closeTextModal() {
  document.getElementById('textModal').style.display = 'none';
}

// Click an assignment row to see its full details (and, for form-type, its questions) -
// mirrors how the student only sees a question set once they open the assignment.
async function viewAssignment(id) {
  const rows = await apiRequest('/lecturer/assignments');
  const a = rows.find(r => r.id === id);
  if (!a) return;

  document.getElementById('textModalTitle').textContent = a.title;
  const dueLabel = new Date(a.due_date).toLocaleString();
  let html = `<p style="margin:0 0 6px;"><strong>Course:</strong> ${a.course_code} - ${a.course_title}</p>
              <p style="margin:0 0 6px;"><strong>Due:</strong> ${dueLabel}</p>`;
  if (a.instructions) {
    html += `<p style="margin:12px 0 6px;"><strong>Instructions:</strong></p>
             <div class="modal-text" style="margin-bottom:14px;">${a.instructions.replace(/</g, '&lt;')}</div>`;
  }
  if (a.file_name) {
    html += `<p><a href="/uploads/${a.file_path}" target="_blank">${a.file_name}</a> (attached brief)</p>`;
  }

  if (a.assignment_type === 'form') {
    const questions = await apiRequest(`/lecturer/assignments/${id}/questions`);
    html += `<h2 style="font-size:1rem; margin-top:18px;">Questions</h2>`;
    html += questions.map((q, i) => {
      if (q.question_type === 'objective') {
        const opts = ['A', 'B', 'C', 'D'].map(letter => {
          const optText = q['option_' + letter.toLowerCase()];
          if (!optText) return '';
          const correct = q.correct_option === letter;
          return `<div class="option-row" style="cursor:default;${correct ? ' background:#eaf5ea; border-color:#b7ddb9; font-weight:600;' : ''}">
                    <span>${correct ? '✓' : ''}</span><span>${letter}. ${optText}</span>
                  </div>`;
        }).join('');
        return `<div class="question-block">
                  <p class="question-stem">${i + 1}. ${q.question_text} <span class="marks-tag">(${q.marks} mark${q.marks == 1 ? '' : 's'})</span></p>
                  <div class="option-list">${opts}</div>
                </div>`;
      }
      return `<div class="question-block">
                <p class="question-stem">${i + 1}. ${q.question_text} <span class="marks-tag">(${q.marks} mark${q.marks == 1 ? '' : 's'}, theory)</span></p>
              </div>`;
    }).join('');
  } else {
    html += `<p style="font-size:0.85rem; color:var(--ink-soft); margin-top:14px;">
               View and grade student submissions under the "File Submissions & Grading" tab.
             </p>`;
  }

  document.getElementById('textModalBody').innerHTML = html;
  document.getElementById('textModal').style.display = 'flex';
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
      <td>${renderTextCell(s.text_content, `sub-${s.id}`, `${s.first_name} ${s.surname} — submission`)}</td>
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
      <td>${renderTextCell(a.answer_text, `ans-${a.id}`, `${a.first_name} ${a.surname} — answer`)}</td>
      <td>${a.max_marks}</td>
      <td>${a.graded ? a.score_awarded : `<input type="number" step="0.01" style="width:60px;" id="ans-input-${a.id}" max="${a.max_marks}">`}</td>
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
  const value = document.getElementById(`ans-input-${answerId}`).value;
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
