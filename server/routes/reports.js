// server/routes/reports.js
const express = require('express');
const router = express.Router();
const { generateStudentReport, generateClassReports, getCertificateData, getHighScorer } = require('../controllers/reportController');
const {protect} = require('../middleware/authMiddleware')

router.get('/student/:id', generateStudentReport);
router.get('/class/:gradeLevel', generateClassReports);
router.get('/certificate-data', protect, getCertificateData);
router.get('/high-scorer', getHighScorer);

module.exports = router;