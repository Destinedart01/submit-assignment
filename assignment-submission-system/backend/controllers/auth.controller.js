const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

// POST /api/auth/register  (students self-register; admin creates lecturers/admins separately)
async function register(req, res) {
  const { username, password, first_name, surname, student_no, sex, dob,
          faculty_id, department_id, program_id } = req.body;

  if (!username || !password || !first_name || !surname || !student_no) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Username already taken.' });
    }

    const roleResult = await client.query("SELECT id FROM roles WHERE name = 'student'");
    const roleId = roleResult.rows[0].id;

    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      'INSERT INTO users (username, password_hash, role_id) VALUES ($1, $2, $3) RETURNING id',
      [username, passwordHash, roleId]
    );
    const userId = userResult.rows[0].id;

    await client.query(
      `INSERT INTO students
        (user_id, faculty_id, department_id, program_id, first_name, surname, student_no, sex, dob)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, faculty_id || null, department_id || null, program_id || null,
       first_name, surname, student_no, sex || null, dob || null]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Registration successful. You can now log in.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Registration failed.', error: err.message });
  } finally {
    client.release();
  }
}

// POST /api/auth/login  (shared login for all 3 roles)
async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required.' });
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.password_hash, u.status, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed.', error: err.message });
  }
}

module.exports = { register, login };
