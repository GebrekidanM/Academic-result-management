// server/routes/reports.js
const express = require('express');
const router = express.Router();
const { generateStudentReport } = require('../controllers/reportController');

router.get('/student/:id', generateStudentReport);

module.exports = router;