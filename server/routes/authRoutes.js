const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');


router.post('/register', register);
router.post('/login', login);

// This is the route our admin form will use. It is protected.
router.post('/register/admin', protect, authorize('admin'), register);
module.exports = router;