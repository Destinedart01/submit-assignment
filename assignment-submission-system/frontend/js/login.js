const form = document.getElementById('loginForm');
const msg = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username, password }
    });

    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('username', data.username);

    if (data.role === 'admin') window.location.href = 'admin-dashboard.html';
    else if (data.role === 'lecturer') window.location.href = 'lecturer-dashboard.html';
    else window.location.href = 'student-dashboard.html';

  } catch (err) {
    showMsg(msg, err.message, true);
  }
});
