const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// This route is for admins only
router.get('/stats', protect, authorize('admin'), getStats);

module.exports = router;