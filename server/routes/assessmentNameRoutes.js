const express = require('express');
const router = express.Router();
const { getAllNames, createName } = require('../controllers/assessmentNameController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAllNames)
    .post(protect, authorize('admin', 'staff'), createName);

module.exports = router;