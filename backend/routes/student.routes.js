const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const student = require('../controllers/student.controller');

router.use(verifyToken, requireRole('student'));

router.get('/course-units', student.availableCourseUnits);
router.post('/register-course', student.registerCourse);
router.get('/my-courses', student.myCourses);

router.get('/assignments', student.myAssignments);
router.post('/assignments/:id/submit', upload.single('file'), student.submitAssignment);

router.get('/results', student.myResults);

module.exports = router;
