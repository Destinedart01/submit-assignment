requireRole('student');
const msg = document.getElementById('msg');
let currentAssignmentId = null;
let currentFormAssignmentId = null;

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
  document.getElementById('assignmentTable').innerHTML = rows.map(a => {
    let status = 'Not started';
    let actionBtn = '';
    if (a.assignment_type === 'file') {
      status = a.submission_id ? (a.submission_grade != null ? `Graded: ${a.submission_grade}` : 'Submitted') : 'Not submitted';
      actionBtn = `<button class="primary" style="margin:0; padding:6px 10px;" onclick="openSubmit(${a.id}, '${a.title.replace(/'/g, "\\'")}')">${a.submission_id ? 'Resubmit' : 'Submit'}</button>`;
    } else {
      status = a.has_answered ? 'Answered' : 'Not answered';
      actionBtn = `<button class="primary" style="margin:0; padding:6px 10px;" onclick="openForm(${a.id}, '${a.title.replace(/'/g, "\\'")}')">${a.has_answered ? 'View / Retake' : 'Answer'}</button>`;
    }
    const brief = a.file_name ? ` <a href="/uploads/${a.file_path}" target="_blank">(brief: ${a.file_name})</a>` : '';
    return row([a.title + brief, a.course_unit_name, new Date(a.due_date).toLocaleString(), status, actionBtn]);
  }).join('');
}

// ---------- File/text submission ----------
function openSubmit(id, title) {
  currentAssignmentId = id;
  document.getElementById('formBox').style.display = 'none';
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
    loadAssignments();
  } catch (err) { showMsg(msg, err.message, true); }
});

// ---------- Interactive form answering ----------
async function openForm(assignmentId, title) {
  currentFormAssignmentId = assignmentId;
  document.getElementById('submitBox').style.display = 'none';
  document.getElementById('formBoxTitle').textContent = 'Answer: ' + title;
  document.getElementById('formBox').style.display = 'block';
  document.getElementById('formResultBox').style.display = 'none';
  document.getElementById('formBox').scrollIntoView({ behavior: 'smooth' });

  const questions = await apiRequest(`/student/assignments/${assignmentId}/questions`);
  document.getElementById('questionsContainer').innerHTML = questions.map((q, i) => {
    if (q.question_type === 'objective') {
      return `
        <div style="margin-bottom:16px;">
          <label>${i + 1}. ${q.question_text} (${q.marks} mark${q.marks == 1 ? '' : 's'})</label>
          ${['A', 'B', 'C', 'D'].map(letter => {
            const optText = q['option_' + letter.toLowerCase()];
            if (!optText) return '';
            return `<div><label style="display:inline-flex; align-items:center; gap:6px; font-size:0.95rem; color:var(--ink);">
                      <input type="radio" name="q-${q.id}" value="${letter}"> ${letter}. ${optText}
                    </label></div>`;
          }).join('')}
        </div>`;
    }
    return `
      <div style="margin-bottom:16px;">
        <label>${i + 1}. ${q.question_text} (${q.marks} mark${q.marks == 1 ? '' : 's'})</label>
        <textarea name="q-${q.id}" data-theory="1"></textarea>
      </div>`;
  }).join('');

  // Show compiled score if already answered
  try {
    const scoreInfo = await apiRequest(`/student/assignments/${assignmentId}/my-score`);
    if (scoreInfo.total_score !== null) {
      const box = document.getElementById('formResultBox');
      box.style.display = 'block';
      box.className = 'msg ' + (scoreInfo.fully_graded ? 'ok' : '');
      box.textContent = scoreInfo.fully_graded
        ? `Final score: ${scoreInfo.total_score} / ${scoreInfo.max_score}`
        : `Current score: ${scoreInfo.total_score} / ${scoreInfo.max_score} (theory answers still being graded)`;
    }
  } catch (err) { /* no score yet - fine */ }
}
document.getElementById('answerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const inputs = document.getElementById('questionsContainer').querySelectorAll('[name^="q-"]');
  const answers = {};
  inputs.forEach(el => {
    const qId = el.name.replace('q-', '');
    if (el.type === 'radio') {
      if (el.checked) answers[qId] = { question_id: Number(qId), selected_option: el.value };
    } else {
      answers[qId] = { question_id: Number(qId), answer_text: el.value };
    }
  });

  try {
    await apiRequest(`/student/assignments/${currentFormAssignmentId}/answers`, {
      method: 'POST',
      body: { answers: Object.values(answers) }
    });
    showMsg(msg, 'Answers submitted.');
    loadAssignments();
    openForm(currentFormAssignmentId, document.getElementById('formBoxTitle').textContent.replace('Answer: ', ''));
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
