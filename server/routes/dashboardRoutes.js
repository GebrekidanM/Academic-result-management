const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('admin', 'staff','accountant'), getStats);

module.exports = router;