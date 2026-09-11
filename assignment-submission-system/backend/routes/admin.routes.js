const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const admin = require('../controllers/admin.controller');

router.use(verifyToken, requireRole('admin'));

router.post('/faculties', admin.createFaculty);
router.get('/faculties', admin.getFaculties);

router.post('/departments', admin.createDepartment);
router.get('/departments', admin.getDepartments);

router.post('/programs', admin.createProgram);
router.get('/programs', admin.getPrograms);

router.post('/academic-years', admin.createAcademicYear);
router.get('/academic-years', admin.getAcademicYears);

router.post('/semesters', admin.createSemester);
router.get('/semesters', admin.getSemesters);

router.post('/courses', admin.createCourse);
router.get('/courses', admin.getCourses);

router.post('/course-units', admin.createCourseUnit);
router.get('/course-units', admin.getCourseUnits);

router.post('/lecturers', admin.registerLecturer);
router.get('/lecturers', admin.getLecturers);

router.post('/teaches', admin.assignTeaches);

router.post('/registration-deadlines', admin.setRegistrationDeadline);
router.post('/pass-marks', admin.setPassMark);

router.get('/students', admin.getStudents);

module.exports = router;
