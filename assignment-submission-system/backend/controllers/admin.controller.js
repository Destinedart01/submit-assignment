const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// ---------- Faculties ----------
async function createFaculty(req, res) {
  const { name } = req.body;
  const result = await pool.query('INSERT INTO faculties (name) VALUES ($1) RETURNING *', [name]);
  res.status(201).json(result.rows[0]);
}
async function getFaculties(req, res) {
  const result = await pool.query('SELECT * FROM faculties ORDER BY name');
  res.json(result.rows);
}

// ---------- Departments ----------
async function createDepartment(req, res) {
  const { faculty_id, name } = req.body;
  const result = await pool.query(
    'INSERT INTO departments (faculty_id, name) VALUES ($1, $2) RETURNING *',
    [faculty_id, name]
  );
  res.status(201).json(result.rows[0]);
}
async function getDepartments(req, res) {
  const result = await pool.query(
    `SELECT d.*, f.name AS faculty_name FROM departments d
     JOIN faculties f ON d.faculty_id = f.id ORDER BY d.name`
  );
  res.json(result.rows);
}

// ---------- Programs ----------
async function createProgram(req, res) {
  const { name } = req.body;
  const result = await pool.query('INSERT INTO programs (name) VALUES ($1) RETURNING *', [name]);
  res.status(201).json(result.rows[0]);
}
async function getPrograms(req, res) {
  const result = await pool.query('SELECT * FROM programs ORDER BY name');
  res.json(result.rows);
}

// ---------- Academic Years & Semesters ----------
async function createAcademicYear(req, res) {
  const { name, start_date, end_date } = req.body;
  const result = await pool.query(
    'INSERT INTO academic_years (name, start_date, end_date) VALUES ($1, $2, $3) RETURNING *',
    [name, start_date, end_date]
  );
  res.status(201).json(result.rows[0]);
}
async function getAcademicYears(req, res) {
  const result = await pool.query('SELECT * FROM academic_years ORDER BY start_date DESC');
  res.json(result.rows);
}
async function createSemester(req, res) {
  const { name } = req.body;
  const result = await pool.query('INSERT INTO semesters (name) VALUES ($1) RETURNING *', [name]);
  res.status(201).json(result.rows[0]);
}
async function getSemesters(req, res) {
  const result = await pool.query('SELECT * FROM semesters ORDER BY id');
  res.json(result.rows);
}

// ---------- Courses & Course Units ----------
async function createCourse(req, res) {
  const { faculty_id, department_id, code, name, duration, tuition } = req.body;
  const result = await pool.query(
    `INSERT INTO courses (faculty_id, department_id, code, name, duration, tuition)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [faculty_id, department_id, code, name, duration, tuition || 0]
  );
  res.status(201).json(result.rows[0]);
}
async function getCourses(req, res) {
  const result = await pool.query(
    `SELECT c.*, f.name AS faculty_name, d.name AS department_name
     FROM courses c
     LEFT JOIN faculties f ON c.faculty_id = f.id
     LEFT JOIN departments d ON c.department_id = d.id
     ORDER BY c.code`
  );
  res.json(result.rows);
}
async function createCourseUnit(req, res) {
  const { course_id, semester_id, name } = req.body;
  const result = await pool.query(
    'INSERT INTO course_units (course_id, semester_id, name) VALUES ($1, $2, $3) RETURNING *',
    [course_id, semester_id, name]
  );
  res.status(201).json(result.rows[0]);
}
async function getCourseUnits(req, res) {
  const result = await pool.query(
    `SELECT cu.*, c.code AS course_code, s.name AS semester_name
     FROM course_units cu
     JOIN courses c ON cu.course_id = c.id
     JOIN semesters s ON cu.semester_id = s.id
     ORDER BY c.code`
  );
  res.json(result.rows);
}

// ---------- Lecturer registration (admin creates lecturer accounts) ----------
async function registerLecturer(req, res) {
  const { username, password, name } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Username already taken.' });
    }

    const roleResult = await client.query("SELECT id FROM roles WHERE name = 'lecturer'");
    const roleId = roleResult.rows[0].id;
    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      'INSERT INTO users (username, password_hash, role_id) VALUES ($1, $2, $3) RETURNING id',
      [username, passwordHash, roleId]
    );
    const userId = userResult.rows[0].id;

    const staffResult = await client.query(
      "INSERT INTO staff (user_id, staff_type, name) VALUES ($1, 'lecturer', $2) RETURNING *",
      [userId, name]
    );

    await client.query('COMMIT');
    res.status(201).json(staffResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to register lecturer.', error: err.message });
  } finally {
    client.release();
  }
}
async function getLecturers(req, res) {
  const result = await pool.query(
    `SELECT s.*, u.username FROM staff s JOIN users u ON s.user_id = u.id
     WHERE s.staff_type = 'lecturer' ORDER BY s.name`
  );
  res.json(result.rows);
}

// ---------- Assign lecturer to course unit ----------
async function assignTeaches(req, res) {
  const { staff_id, course_unit_id } = req.body;
  const result = await pool.query(
    'INSERT INTO teaches (staff_id, course_unit_id) VALUES ($1, $2) RETURNING *',
    [staff_id, course_unit_id]
  );
  res.status(201).json(result.rows[0]);
}

// ---------- Registration deadlines & pass marks ----------
async function setRegistrationDeadline(req, res) {
  const { academic_year_id, semester_id, deadline_date } = req.body;
  const result = await pool.query(
    `INSERT INTO registration_deadlines (academic_year_id, semester_id, deadline_date)
     VALUES ($1, $2, $3) RETURNING *`,
    [academic_year_id, semester_id, deadline_date]
  );
  res.status(201).json(result.rows[0]);
}
async function setPassMark(req, res) {
  const { pass_mark } = req.body;
  const result = await pool.query(
    'INSERT INTO pass_marks (pass_mark) VALUES ($1) RETURNING *',
    [pass_mark]
  );
  res.status(201).json(result.rows[0]);
}

// ---------- Students overview ----------
async function getStudents(req, res) {
  const result = await pool.query(
    `SELECT s.*, u.username, f.name AS faculty_name, d.name AS department_name
     FROM students s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN faculties f ON s.faculty_id = f.id
     LEFT JOIN departments d ON s.department_id = d.id
     ORDER BY s.surname`
  );
  res.json(result.rows);
}

module.exports = {
  createFaculty, getFaculties,
  createDepartment, getDepartments,
  createProgram, getPrograms,
  createAcademicYear, getAcademicYears,
  createSemester, getSemesters,
  createCourse, getCourses,
  createCourseUnit, getCourseUnits,
  registerLecturer, getLecturers,
  assignTeaches,
  setRegistrationDeadline, setPassMark,
  getStudents
};
