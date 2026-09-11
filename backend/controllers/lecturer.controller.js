const pool = require('../config/db');

// Helper: get staff.id for the logged-in lecturer's user id
async function getStaffId(userId) {
  const result = await pool.query('SELECT id FROM staff WHERE user_id = $1', [userId]);
  return result.rows[0] ? result.rows[0].id : null;
}

// GET /api/lecturer/course-units  -> course units this lecturer teaches
async function myCourseUnits(req, res) {
  const staffId = await getStaffId(req.user.id);
  const result = await pool.query(
    `SELECT cu.*, c.code AS course_code, c.name AS course_name
     FROM teaches t
     JOIN course_units cu ON t.course_unit_id = cu.id
     JOIN courses c ON cu.course_id = c.id
     WHERE t.staff_id = $1`,
    [staffId]
  );
  res.json(result.rows);
}

// POST /api/lecturer/assignments
async function createAssignment(req, res) {
  const staffId = await getStaffId(req.user.id);
  const { course_unit_id, title, instructions, due_date } = req.body;
  const result = await pool.query(
    `INSERT INTO assignments (course_unit_id, lecturer_id, title, instructions, due_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [course_unit_id, staffId, title, instructions, due_date]
  );
  res.status(201).json(result.rows[0]);
}

// GET /api/lecturer/assignments -> assignments created by this lecturer
async function myAssignments(req, res) {
  const staffId = await getStaffId(req.user.id);
  const result = await pool.query(
    `SELECT a.*, cu.name AS course_unit_name FROM assignments a
     JOIN course_units cu ON a.course_unit_id = cu.id
     WHERE a.lecturer_id = $1 ORDER BY a.due_date`,
    [staffId]
  );
  res.json(result.rows);
}

// GET /api/lecturer/assignments/:id/submissions
async function getSubmissions(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT sub.*, st.first_name, st.surname, st.student_no
     FROM submissions sub
     JOIN students st ON sub.student_id = st.id
     WHERE sub.assignment_id = $1
     ORDER BY sub.submitted_at`,
    [id]
  );
  res.json(result.rows);
}

// PUT /api/lecturer/submissions/:id/grade
async function gradeSubmission(req, res) {
  const { id } = req.params;
  const { grade } = req.body;
  const result = await pool.query(
    'UPDATE submissions SET grade = $1 WHERE id = $2 RETURNING *',
    [grade, id]
  );
  res.json(result.rows[0]);
}

// POST /api/lecturer/results -> enter coursework/exam scores, compute total + letter grade
async function enterResult(req, res) {
  const staffId = await getStaffId(req.user.id);
  const { student_id, course_unit_id, coursework_score, exam_score } = req.body;
  const total = Number(coursework_score) + Number(exam_score);

  const scaleResult = await pool.query(
    'SELECT grade FROM grade_scale WHERE $1 BETWEEN lower_bound AND upper_bound',
    [total]
  );
  const grade = scaleResult.rows[0] ? scaleResult.rows[0].grade : 'F';

  const result = await pool.query(
    `INSERT INTO results (student_id, course_unit_id, staff_id, coursework_score, exam_score, total_score, grade)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (student_id, course_unit_id)
     DO UPDATE SET coursework_score = $4, exam_score = $5, total_score = $6, grade = $7, result_date = NOW()
     RETURNING *`,
    [student_id, course_unit_id, staffId, coursework_score, exam_score, total, grade]
  );
  res.status(201).json(result.rows[0]);
}

// GET /api/lecturer/students/lookup?student_no=XYZ
async function lookupStudent(req, res) {
  const { student_no } = req.query;
  const result = await pool.query(
    'SELECT id, first_name, surname, student_no FROM students WHERE student_no = $1',
    [student_no]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'No student found with that student number.' });
  }
  res.json(result.rows[0]);
}

module.exports = { myCourseUnits, createAssignment, myAssignments, getSubmissions, gradeSubmission, enterResult, lookupStudent };
