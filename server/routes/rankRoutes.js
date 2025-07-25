const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getStudentRank, getOverallRank } = require('../controllers/rankController'); // Import the new function

router.get('/class-rank/:studentId', protect, getStudentRank);
router.get('/overall-rank/:studentId', protect, getOverallRank);
module.exports = router;