// Small fetch wrapper shared by every page.
// Since the frontend is served by the same Express app, relative URLs work
// both locally and on Render.
const API_BASE = '/api';

function getToken() { return localStorage.getItem('token'); }
function getRole() { return localStorage.getItem('role'); }
function getUsername() { return localStorage.getItem('username'); }

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// Redirects away from a dashboard page if there's no valid session, or the
// wrong role is trying to access it.
function requireRole(expectedRole) {
  const token = getToken();
  const role = getRole();
  if (!token || role !== expectedRole) {
    window.location.href = 'login.html';
  }
}

// `opts.body` may be a plain object (JSON) or a FormData instance (file upload).
async function apiRequest(path, opts = {}) {
  const headers = opts.headers || {};
  let body = opts.body;

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...opts, headers, body });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

function showMsg(el, text, isError = false) {
  el.textContent = text;
  el.className = 'msg ' + (isError ? 'err' : 'ok');
  el.style.display = 'block';
}
