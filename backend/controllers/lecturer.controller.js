const pool = require('../config/db');

// Helper: get staff.id for the logged-in lecturer's user id
async function getStaffId(userId) {
  const result = await pool.query('SELECT id FROM staff WHERE user_id = $1', [userId]);
  return result.rows[0] ? result.rows[0].id : null;
}

// GET /api/lecturer/courses -> courses this lecturer teaches
async function myCourses(req, res) {
  const staffId = await getStaffId(req.user.id);
  const result = await pool.query(
    `SELECT c.*, s.name AS semester_name
     FROM teaches t
     JOIN courses c ON t.course_id = c.id
     LEFT JOIN semesters s ON c.semester_id = s.id
     WHERE t.staff_id = $1`,
    [staffId]
  );
  res.json(result.rows);
}

// POST /api/lecturer/assignments
// assignment_type: 'file' (brief + optional attachment, student uploads text/file back)
//                or 'form' (lecturer builds objective/theory questions, auto-compiled score)
// Due date and max_score are entirely the lecturer's call.
async function createAssignment(req, res) {
  const staffId = await getStaffId(req.user.id);
  const { course_id, title, instructions, due_date, assignment_type, max_score } = req.body;
  const file = req.file;
  const type = assignment_type === 'form' ? 'form' : 'file';

  const result = await pool.query(
    `INSERT INTO assignments
       (course_id, lecturer_id, title, instructions, due_date, assignment_type, max_score, file_path, file_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [course_id, staffId, title, instructions, due_date, type,
     type === 'file' ? (max_score || null) : null,
     file ? file.filename : null, file ? file.originalname : null]
  );
  res.status(201).json(result.rows[0]);
}

// GET /api/lecturer/assignments -> assignments created by this lecturer
async function myAssignments(req, res) {
  const staffId = await getStaffId(req.user.id);
  const result = await pool.query(
    `SELECT a.*, c.code AS course_code, c.title AS course_title FROM assignments a
     JOIN courses c ON a.course_id = c.id
     WHERE a.lecturer_id = $1 ORDER BY a.due_date`,
    [staffId]
  );
  res.json(result.rows);
}

// GET /api/lecturer/assignments/:id/submissions  (for 'file' type assignments)
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
// Marking an assignment submission is entirely the lecturer's call - it is
// independent of the admin-controlled grade scale, which only applies to
// overall course results (see enterResult below).
async function gradeSubmission(req, res) {
  const { id } = req.params;
  const { grade } = req.body;
  const result = await pool.query(
    'UPDATE submissions SET grade = $1 WHERE id = $2 RETURNING *',
    [grade, id]
  );
  res.json(result.rows[0]);
}

// ---------- Interactive form-based assignments ----------

// POST /api/lecturer/assignments/:id/questions -> add one question to a 'form' assignment
async function addQuestion(req, res) {
  const { id } = req.params; // assignment id
  const { question_text, question_type, option_a, option_b, option_c, option_d, correct_option, marks } = req.body;

  const result = await pool.query(
    `INSERT INTO assignment_questions
       (assignment_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, marks)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [id, question_text, question_type,
     question_type === 'objective' ? option_a : null,
     question_type === 'objective' ? option_b : null,
     question_type === 'objective' ? option_c : null,
     question_type === 'objective' ? option_d : null,
     question_type === 'objective' ? correct_option : null,
     marks || 1]
  );

  // Keep the assignment's max_score in sync with the sum of its question marks
  await pool.query(
    `UPDATE assignments SET max_score = (
       SELECT COALESCE(SUM(marks), 0) FROM assignment_questions WHERE assignment_id = $1
     ) WHERE id = $1`,
    [id]
  );

  res.status(201).json(result.rows[0]);
}

// GET /api/lecturer/assignments/:id/questions -> full question list (with correct answers, for the owning lecturer)
async function getQuestionsForLecturer(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    'SELECT * FROM assignment_questions WHERE assignment_id = $1 ORDER BY id',
    [id]
  );
  res.json(result.rows);
}

async function deleteQuestion(req, res) {
  const { id } = req.params; // question id
  const q = await pool.query('SELECT assignment_id FROM assignment_questions WHERE id = $1', [id]);
  if (q.rows.length === 0) return res.status(404).json({ message: 'Question not found.' });
  const assignmentId = q.rows[0].assignment_id;

  await pool.query('DELETE FROM assignment_questions WHERE id = $1', [id]);
  await pool.query(
    `UPDATE assignments SET max_score = (
       SELECT COALESCE(SUM(marks), 0) FROM assignment_questions WHERE assignment_id = $1
     ) WHERE id = $1`,
    [assignmentId]
  );
  res.json({ message: 'Question removed.' });
}

// GET /api/lecturer/assignments/:id/theory-answers -> ungraded theory answers for a form assignment
async function getTheoryAnswers(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT sa.*, aq.question_text, aq.marks AS max_marks, st.first_name, st.surname, st.student_no
     FROM student_answers sa
     JOIN assignment_questions aq ON sa.question_id = aq.id
     JOIN students st ON sa.student_id = st.id
     WHERE aq.assignment_id = $1 AND aq.question_type = 'theory'
     ORDER BY sa.graded ASC, st.surname`,
    [id]
  );
  res.json(result.rows);
}

// PUT /api/lecturer/answers/:id/grade -> lecturer scores one theory answer
async function gradeAnswer(req, res) {
  const { id } = req.params;
  const { score_awarded } = req.body;
  const result = await pool.query(
    'UPDATE student_answers SET score_awarded = $1, graded = TRUE WHERE id = $2 RETURNING *',
    [score_awarded, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ message: 'Answer not found.' });
  res.json(result.rows[0]);
}

// GET /api/lecturer/assignments/:id/scores -> compiled score per student for a form assignment
async function getFormScores(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT st.id AS student_id, st.first_name, st.surname, st.student_no,
            SUM(COALESCE(sa.score_awarded, 0)) AS total_score,
            BOOL_AND(sa.graded) AS fully_graded
     FROM student_answers sa
     JOIN assignment_questions aq ON sa.question_id = aq.id
     JOIN students st ON sa.student_id = st.id
     WHERE aq.assignment_id = $1
     GROUP BY st.id, st.first_name, st.surname, st.student_no
     ORDER BY st.surname`,
    [id]
  );
  res.json(result.rows);
}

// ---------- Course results (separate from assignment marking) ----------

// POST /api/lecturer/results -> enter a score for the course, computes the letter grade
// This uses the admin-defined grade scale and is for overall course results,
// NOT assignment marking (which is entirely the lecturer's own call above).
async function enterResult(req, res) {
  const staffId = await getStaffId(req.user.id);
  const { student_id, course_id, score } = req.body;
  const total = Number(score);

  const scaleResult = await pool.query(
    'SELECT grade FROM grade_scale WHERE $1 BETWEEN lower_bound AND upper_bound',
    [total]
  );
  const grade = scaleResult.rows[0] ? scaleResult.rows[0].grade : 'F';

  const result = await pool.query(
    `INSERT INTO results (student_id, course_id, staff_id, coursework_score, total_score, grade)
     VALUES ($1, $2, $3, $4, $4, $5)
     ON CONFLICT (student_id, course_id)
     DO UPDATE SET coursework_score = $4, total_score = $4, grade = $5, result_date = NOW()
     RETURNING *`,
    [student_id, course_id, staffId, total, grade]
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

module.exports = {
  myCourses, createAssignment, myAssignments, getSubmissions, gradeSubmission,
  addQuestion, getQuestionsForLecturer, deleteQuestion,
  getTheoryAnswers, gradeAnswer, getFormScores,
  enterResult, lookupStudent
};
