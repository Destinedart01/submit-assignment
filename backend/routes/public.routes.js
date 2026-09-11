const express = require('express');
const router = express.Router();
const pub = require('../controllers/public.controller');

router.get('/faculties', pub.getFaculties);
router.get('/departments', pub.getDepartments);
router.get('/programs', pub.getPrograms);
router.get('/academic-years', pub.getAcademicYears);
router.get('/semesters', pub.getSemesters);

module.exports = router;
