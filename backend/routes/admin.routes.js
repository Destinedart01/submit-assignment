const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const admin = require('../controllers/admin.controller');

router.use(verifyToken, requireRole('admin'));

router.post('/faculties', asyncHandler(admin.createFaculty));
router.get('/faculties', asyncHandler(admin.getFaculties));
router.put('/faculties/:id', asyncHandler(admin.updateFaculty));
router.delete('/faculties/:id', asyncHandler(admin.deleteFaculty));

router.post('/departments', asyncHandler(admin.createDepartment));
router.get('/departments', asyncHandler(admin.getDepartments));
router.put('/departments/:id', asyncHandler(admin.updateDepartment));
router.delete('/departments/:id', asyncHandler(admin.deleteDepartment));

router.post('/programs', asyncHandler(admin.createProgram));
router.get('/programs', asyncHandler(admin.getPrograms));
router.put('/programs/:id', asyncHandler(admin.updateProgram));
router.delete('/programs/:id', asyncHandler(admin.deleteProgram));

router.post('/academic-years', asyncHandler(admin.createAcademicYear));
router.get('/academic-years', asyncHandler(admin.getAcademicYears));
router.put('/academic-years/:id', asyncHandler(admin.updateAcademicYear));
router.delete('/academic-years/:id', asyncHandler(admin.deleteAcademicYear));

router.post('/semesters', asyncHandler(admin.createSemester));
router.get('/semesters', asyncHandler(admin.getSemesters));
router.put('/semesters/:id', asyncHandler(admin.updateSemester));
router.delete('/semesters/:id', asyncHandler(admin.deleteSemester));

router.post('/courses', asyncHandler(admin.createCourse));
router.get('/courses', asyncHandler(admin.getCourses));
router.put('/courses/:id', asyncHandler(admin.updateCourse));
router.delete('/courses/:id', asyncHandler(admin.deleteCourse));

router.post('/course-units', asyncHandler(admin.createCourseUnit));
router.get('/course-units', asyncHandler(admin.getCourseUnits));
router.put('/course-units/:id', asyncHandler(admin.updateCourseUnit));
router.delete('/course-units/:id', asyncHandler(admin.deleteCourseUnit));

router.post('/lecturers', asyncHandler(admin.registerLecturer));
router.get('/lecturers', asyncHandler(admin.getLecturers));
router.put('/lecturers/:id', asyncHandler(admin.updateLecturer));
router.delete('/lecturers/:id', asyncHandler(admin.deleteLecturer));

router.post('/teaches', asyncHandler(admin.assignTeaches));
router.get('/teaches', asyncHandler(admin.getTeaches));
router.delete('/teaches/:id', asyncHandler(admin.deleteTeaches));

router.post('/registration-deadlines', asyncHandler(admin.setRegistrationDeadline));
router.post('/pass-marks', asyncHandler(admin.setPassMark));

router.get('/students', asyncHandler(admin.getStudents));
router.delete('/students/:id', asyncHandler(admin.deleteStudent));

module.exports = router;
