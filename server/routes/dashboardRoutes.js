const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController'); 
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('admin', 'staff','accountant'), statsController.getStats);

module.exports = router;