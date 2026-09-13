const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const asyncHandler = require('../middleware/asyncHandler');
const student = require('../controllers/student.controller');

router.use(verifyToken, requireRole('student'));

router.get('/courses', asyncHandler(student.availableCourses));
router.post('/register-course', asyncHandler(student.registerCourse));
router.get('/my-courses', asyncHandler(student.myCourses));

router.get('/assignments', asyncHandler(student.myAssignments));
router.post('/assignments/:id/submit', upload.single('file'), asyncHandler(student.submitAssignment));

// Interactive form-based assignments
router.get('/assignments/:id/questions', asyncHandler(student.getAssignmentQuestions));
router.get('/assignments/:id/answers', asyncHandler(student.getMyAnswers));
router.post('/assignments/:id/answers', asyncHandler(student.submitAnswers));
router.get('/assignments/:id/my-score', asyncHandler(student.myFormScore));

router.get('/results', asyncHandler(student.myResults));

module.exports = router;
