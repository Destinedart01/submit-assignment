const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const lecturer = require('../controllers/lecturer.controller');

router.use(verifyToken, requireRole('lecturer'));

router.get('/course-units', lecturer.myCourseUnits);

router.post('/assignments', lecturer.createAssignment);
router.get('/assignments', lecturer.myAssignments);
router.get('/assignments/:id/submissions', lecturer.getSubmissions);

router.put('/submissions/:id/grade', lecturer.gradeSubmission);

router.post('/results', lecturer.enterResult);

router.get('/students/lookup', lecturer.lookupStudent);

module.exports = router;
