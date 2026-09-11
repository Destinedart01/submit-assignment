const pool = require('../config/db');

async function getStudentId(userId) {
  const result = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
  return result.rows[0] ? result.rows[0].id : null;
}

// GET /api/student/course-units -> units available to register for
async function availableCourseUnits(req, res) {
  const result = await pool.query(
    `SELECT cu.*, c.code AS course_code, c.name AS course_name
     FROM course_units cu JOIN courses c ON cu.course_id = c.id
     ORDER BY c.code`
  );
  res.json(result.rows);
}

// POST /api/student/register-course
async function registerCourse(req, res) {
  const studentId = await getStudentId(req.user.id);
  const { academic_year_id, semester_id, course_unit_id } = req.body;
  const result = await pool.query(
    `INSERT INTO registrations (student_id, academic_year_id, semester_id, course_unit_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [studentId, academic_year_id, semester_id, course_unit_id]
  );
  res.status(201).json(result.rows[0]);
}

// GET /api/student/my-courses -> registered course units
async function myCourses(req, res) {
  const studentId = await getStudentId(req.user.id);
  const result = await pool.query(
    `SELECT r.*, cu.name AS course_unit_name, c.code AS course_code
     FROM registrations r
     JOIN course_units cu ON r.course_unit_id = cu.id
     JOIN courses c ON cu.course_id = c.id
     WHERE r.student_id = $1`,
    [studentId]
  );
  res.json(result.rows);
}

// GET /api/student/assignments -> assignments for registered course units
async function myAssignments(req, res) {
  const studentId = await getStudentId(req.user.id);
  const result = await pool.query(
    `SELECT a.*, cu.name AS course_unit_name
     FROM assignments a
     JOIN course_units cu ON a.course_unit_id = cu.id
     JOIN registrations r ON r.course_unit_id = cu.id
     WHERE r.student_id = $1
     ORDER BY a.due_date`,
    [studentId]
  );
  res.json(result.rows);
}

// POST /api/student/assignments/:id/submit  (multipart/form-data: text_content + optional file)
async function submitAssignment(req, res) {
  const studentId = await getStudentId(req.user.id);
  const { id } = req.params;
  const { text_content } = req.body;
  const file = req.file;

  const result = await pool.query(
    `INSERT INTO submissions (assignment_id, student_id, text_content, file_path, file_name)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (assignment_id, student_id)
     DO UPDATE SET text_content = $3, file_path = $4, file_name = $5, submitted_at = NOW()
     RETURNING *`,
    [id, studentId, text_content || null, file ? file.path : null, file ? file.originalname : null]
  );
  res.status(201).json(result.rows[0]);
}

// GET /api/student/results
async function myResults(req, res) {
  const studentId = await getStudentId(req.user.id);
  const result = await pool.query(
    `SELECT res.*, cu.name AS course_unit_name, c.code AS course_code
     FROM results res
     JOIN course_units cu ON res.course_unit_id = cu.id
     JOIN courses c ON cu.course_id = c.id
     WHERE res.student_id = $1`,
    [studentId]
  );
  res.json(result.rows);
}

module.exports = { availableCourseUnits, registerCourse, myCourses, myAssignments, submitAssignment, myResults };
