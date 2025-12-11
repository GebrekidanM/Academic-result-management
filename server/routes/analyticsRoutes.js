// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { getAssessmentAnalysis, getClassAnalytics,getSubjectPerformanceAnalysis, getAtRiskStudents} = require('../controllers/analyticsController');
const { 
    protect, 
    authorizeAnalytics,    
} = require('../middleware/authMiddleware');

// The definitive, secure route for getting assessment analysis
router.get('/class-analytics',protect,getClassAnalytics)
router.get('/assessment', protect, authorizeAnalytics, getAssessmentAnalysis);
router.get('/aGradeAnalysis',getSubjectPerformanceAnalysis)
router.get('/at-risk', protect, getAtRiskStudents);
module.exports = router;