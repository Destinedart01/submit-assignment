const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { register, login } = require('../controllers/auth.controller');

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));

module.exports = router;
