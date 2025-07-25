// backend/routes/studentAuthRoutes.js
const express = require('express');
const { protectStudent } = require('../middleware/authMiddleware');
const { loginStudent, changePassword } = require('../controllers/studentAuthController'); 

const router = express.Router();

router.post('/login', loginStudent);
router.put('/change-password', protectStudent, changePassword);

module.exports = router;