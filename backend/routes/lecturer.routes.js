const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const upload = require('../middleware/upload');
const lecturer = require('../controllers/lecturer.controller');

router.use(verifyToken, requireRole('lecturer'));

router.get('/courses', asyncHandler(lecturer.myCourses));

router.post('/assignments', upload.single('file'), asyncHandler(lecturer.createAssignment));
router.get('/assignments', asyncHandler(lecturer.myAssignments));
router.get('/assignments/:id/submissions', asyncHandler(lecturer.getSubmissions));

router.put('/submissions/:id/grade', asyncHandler(lecturer.gradeSubmission));

// Interactive form-based assignments
router.post('/assignments/:id/questions', asyncHandler(lecturer.addQuestion));
router.get('/assignments/:id/questions', asyncHandler(lecturer.getQuestionsForLecturer));
router.delete('/questions/:id', asyncHandler(lecturer.deleteQuestion));
router.get('/assignments/:id/theory-answers', asyncHandler(lecturer.getTheoryAnswers));
router.put('/answers/:id/grade', asyncHandler(lecturer.gradeAnswer));
router.get('/assignments/:id/scores', asyncHandler(lecturer.getFormScores));

router.post('/results', asyncHandler(lecturer.enterResult));
router.get('/students/lookup', asyncHandler(lecturer.lookupStudent));

module.exports = router;
