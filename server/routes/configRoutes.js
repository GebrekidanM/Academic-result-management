const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../controllers/configController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getConfig);
router.put('/', protect, authorize('admin'), updateConfig);

module.exports = router;
