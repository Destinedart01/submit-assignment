const pool = require('../config/db');

async function getStudentId(userId) {
  const result = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
  return result.rows[0] ? result.rows[0].id : null;
}

// GET /api/student/courses -> courses available to register for
async function availableCourses(req, res) {
  const result = await pool.query(
    `SELECT c.*, s.name AS semester_name
     FROM courses c LEFT JOIN semesters s ON c.semester_id = s.id
     ORDER BY c.code`
  );
  res.json(result.rows);
}

// POST /api/student/register-course
async function registerCourse(req, res) {
  const studentId = await getStudentId(req.user.id);
  const { academic_year_id, semester_id, course_id } = req.body;
  const result = await pool.query(
    `INSERT INTO registrations (student_id, academic_year_id, semester_id, course_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [studentId, academic_year_id, semester_id, course_id]
  );
  res.status(201).json(result.rows[0]);
}

// GET /api/student/my-courses -> registered courses
async function myCourses(req, res) {
  const studentId = await getStudentId(req.user.id);
  const result = await pool.query(
    `SELECT r.*, c.title AS course_title, c.code AS course_code
     FROM registrations r
     JOIN courses c ON r.course_id = c.id
     WHERE r.student_id = $1`,
    [studentId]
  );
  res.json(result.rows);
}

// GET /api/student/assignments -> assignments for registered courses
// Includes assignment_type/max_score so the frontend knows whether to show
// the file/text submit box or the interactive question form, plus whether
// this student has already submitted/answered it.
async function myAssignments(req, res) {
  const studentId = await getStudentId(req.user.id);
  const result = await pool.query(
    `SELECT a.*, c.title AS course_title, c.code AS course_code,
            sub.id AS submission_id, sub.grade AS submission_grade,
            EXISTS(SELECT 1 FROM student_answers sa
                   JOIN assignment_questions aq ON sa.question_id = aq.id
                   WHERE aq.assignment_id = a.id AND sa.student_id = $1) AS has_answered
     FROM assignments a
     JOIN courses c ON a.course_id = c.id
     JOIN registrations r ON r.course_id = c.id
     LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.student_id = $1
     WHERE r.student_id = $1
     ORDER BY a.due_date`,
    [studentId]
  );
  res.json(result.rows);
}

// POST /api/student/assignments/:id/submit  (multipart/form-data: text_content + optional file)
// Only used for 'file' type assignments.
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
    [id, studentId, text_content || null, file ? file.filename : null, file ? file.originalname : null]
  );
  res.status(201).json(result.rows[0]);
}

// ---------- Interactive form-based assignments ----------

// GET /api/student/assignments/:id/questions -> questions WITHOUT the correct answer exposed
async function getAssignmentQuestions(req, res) {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT id, question_text, question_type, option_a, option_b, option_c, option_d, marks
     FROM assignment_questions WHERE assignment_id = $1 ORDER BY id`,
    [id]
  );
  res.json(result.rows);
}

// GET /api/student/assignments/:id/answers -> this student's own previously-submitted answers
// (used to render a read-only view once they've already answered - no resubmission allowed)
async function getMyAnswers(req, res) {
  const studentId = await getStudentId(req.user.id);
  const { id } = req.params;
  const result = await pool.query(
    `SELECT aq.id AS question_id, aq.question_text, aq.question_type, aq.marks,
            aq.option_a, aq.option_b, aq.option_c, aq.option_d,
            sa.selected_option, sa.answer_text, sa.score_awarded, sa.graded
     FROM assignment_questions aq
     LEFT JOIN student_answers sa ON sa.question_id = aq.id AND sa.student_id = $2
     WHERE aq.assignment_id = $1
     ORDER BY aq.id`,
    [id, studentId]
  );
  res.json(result.rows);
}

// POST /api/student/assignments/:id/answers
// body: { answers: [ { question_id, selected_option? , answer_text? } ] }
// Objective answers are auto-graded here; theory answers are left ungraded
// for the lecturer to score later.
// Once a student has answered any question of this assignment, further
// submissions are rejected - no resubmission/retake is allowed.
async function submitAnswers(req, res) {
  const studentId = await getStudentId(req.user.id);
  const { id } = req.params;
  const { answers } = req.body;

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: 'No answers were provided.' });
  }

  const already = await pool.query(
    `SELECT 1 FROM student_answers sa
     JOIN assignment_questions aq ON sa.question_id = aq.id
     WHERE aq.assignment_id = $1 AND sa.student_id = $2 LIMIT 1`,
    [id, studentId]
  );
  if (already.rows.length > 0) {
    return res.status(409).json({ message: 'You have already answered this assignment. Answers cannot be changed once submitted.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const ans of answers) {
      const qResult = await client.query(
        'SELECT question_type, correct_option, marks FROM assignment_questions WHERE id = $1',
        [ans.question_id]
      );
      if (qResult.rows.length === 0) continue;
      const q = qResult.rows[0];

      let scoreAwarded = null;
      let graded = false;
      if (q.question_type === 'objective') {
        scoreAwarded = (ans.selected_option && ans.selected_option === q.correct_option) ? q.marks : 0;
        graded = true;
      }

      await client.query(
        `INSERT INTO student_answers (question_id, student_id, selected_option, answer_text, score_awarded, graded)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (question_id, student_id) DO NOTHING`,
        [ans.question_id, studentId, ans.selected_option || null, ans.answer_text || null, scoreAwarded, graded]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Answers submitted.' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// GET /api/student/assignments/:id/my-score -> compiled score for a form assignment
async function myFormScore(req, res) {
  const studentId = await getStudentId(req.user.id);
  const { id } = req.params;
  const result = await pool.query(
    `SELECT SUM(COALESCE(sa.score_awarded, 0)) AS total_score, BOOL_AND(sa.graded) AS fully_graded,
            (SELECT max_score FROM assignments WHERE id = $1) AS max_score
     FROM student_answers sa
     JOIN assignment_questions aq ON sa.question_id = aq.id
     WHERE aq.assignment_id = $1 AND sa.student_id = $2`,
    [id, studentId]
  );
  res.json(result.rows[0] || { total_score: 0, fully_graded: false, max_score: null });
}

// GET /api/student/results
async function myResults(req, res) {
  const studentId = await getStudentId(req.user.id);
  const result = await pool.query(
    `SELECT res.*, c.title AS course_title, c.code AS course_code
     FROM results res
     JOIN courses c ON res.course_id = c.id
     WHERE res.student_id = $1`,
    [studentId]
  );
  res.json(result.rows);
}

module.exports = {
  availableCourses, registerCourse, myCourses, myAssignments, submitAssignment,
  getAssignmentQuestions, getMyAnswers, submitAnswers, myFormScore,
  myResults
};
