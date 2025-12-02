// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { getAssessmentAnalysis ,aGradeAnalysis} = require('../controllers/analyticsController');
const { 
    protect, 
    authorizeAnalytics,    
} = require('../middleware/authMiddleware');

// The definitive, secure route for getting assessment analysis
router.get('/assessment', protect, authorizeAnalytics, getAssessmentAnalysis);
router.get('/aGradeAnalysis/:assessment',aGradeAnalysis)

module.exports = router;