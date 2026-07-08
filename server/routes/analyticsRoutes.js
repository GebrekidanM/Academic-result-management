// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { getAssessmentAnalysis, getClassAnalytics,getSubjectPerformanceAnalysis, getAtRiskStudents, getYearlyEnrollmentAnalytics, getClassOverallAverageAnalysis} = require('../controllers/analyticsController');
const { protect, authorizeAnalytics} = require('../middleware/authMiddleware');

// The definitive, secure route for getting assessment analysis
router.get('/class-analytics',protect,getClassAnalytics)
router.get('/assessment', protect, authorizeAnalytics, getAssessmentAnalysis);
router.get('/aGradeAnalysis',getSubjectPerformanceAnalysis)
router.get('/at-risk', protect, getAtRiskStudents);
router.get('/retention', protect, getYearlyEnrollmentAnalytics)
// በ routes/analyticsRoutes.js ውስጥ ይህንን መስመር ጨምር፡
router.get('/overall-average-analysis', protect, getClassOverallAverageAnalysis);
module.exports = router;