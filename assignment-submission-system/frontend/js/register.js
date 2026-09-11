const facultySel = document.getElementById('faculty_id');
const deptSel = document.getElementById('department_id');
const progSel = document.getElementById('program_id');
const msg = document.getElementById('msg');

function fillSelect(sel, rows, placeholder) {
  sel.innerHTML = `<option value="">${placeholder}</option>` +
    rows.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
}

async function loadLookups() {
  try {
    const [faculties, programs] = await Promise.all([
      apiRequest('/public/faculties'),
      apiRequest('/public/programs')
    ]);
    fillSelect(facultySel, faculties, 'Select faculty (optional)');
    fillSelect(progSel, programs, 'Select program (optional)');
    fillSelect(deptSel, [], 'Select faculty first');
  } catch (err) {
    // Non-fatal: registration can still proceed without these selected.
    console.error(err);
  }
}

facultySel.addEventListener('change', async () => {
  if (!facultySel.value) return fillSelect(deptSel, [], 'Select faculty first');
  const departments = await apiRequest('/public/departments?faculty_id=' + facultySel.value);
  fillSelect(deptSel, departments, 'Select department (optional)');
});

document.getElementById('regForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        first_name: document.getElementById('first_name').value.trim(),
        surname: document.getElementById('surname').value.trim(),
        student_no: document.getElementById('student_no').value.trim(),
        sex: document.getElementById('sex').value,
        dob: document.getElementById('dob').value || null,
        faculty_id: facultySel.value || null,
        department_id: deptSel.value || null,
        program_id: progSel.value || null,
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
      }
    });
    showMsg(msg, 'Registration successful. Redirecting to sign in...');
    setTimeout(() => window.location.href = 'login.html', 1200);
  } catch (err) {
    showMsg(msg, err.message, true);
  }
});

loadLookups();
