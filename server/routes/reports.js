// server/routes/reports.js
const express = require('express');
const router = express.Router();
const { generateStudentReport, generateClassReports, getCertificateData, getHighScorers } = require('../controllers/reportController');
const {protect} = require('../middleware/authMiddleware')

router.get('/student/:id', generateStudentReport);
router.get('/class/:gradeLevel', generateClassReports);
router.get('/certificate-data', protect, getCertificateData);
router.get('/high-scorers', getHighScorers);

module.exports = router;