// server/routes/reports.js
const express = require('express');
const router = express.Router();
const { generateStudentReport, generateClassReports } = require('../controllers/reportController');

router.get('/student/:id', generateStudentReport);
router.get('/class/:gradeLevel', generateClassReports);
module.exports = router;