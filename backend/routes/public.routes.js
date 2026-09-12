const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const pub = require('../controllers/public.controller');

router.get('/faculties', asyncHandler(pub.getFaculties));
router.get('/departments', asyncHandler(pub.getDepartments));
router.get('/programs', asyncHandler(pub.getPrograms));
router.get('/academic-years', asyncHandler(pub.getAcademicYears));
router.get('/semesters', asyncHandler(pub.getSemesters));

module.exports = router;
