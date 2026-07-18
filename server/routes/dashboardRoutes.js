const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController'); 
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('admin', 'staff','accountant'), dashboardController.getStats);

module.exports = router;