// backend/routes/behavioralReportRoutes.js
const express = require('express');
const router = express.Router();
const { 
    addReport, 
    getReportsByStudent,
    getReportById,
    updateReport,
    deleteReport 
} = require('../controllers/behavioralReportController');

// Import your definitive middleware
const { protect, isHomeroomTeacherForStudent, canViewStudentData } = require('../middleware/authMiddleware');
// --- SECURE ROUTE DEFINITIONS ---

// Rule: Any logged-in user can add a new report.
router.route('/')
    .post(protect, isHomeroomTeacherForStudent, addReport);

// === THIS IS THE CRITICAL ROUTE THAT IS LIKELY CAUSING THE 404 ERROR ===
// It MUST be defined to handle GET requests to /api/reports/student/:studentId
router.route('/student/:studentId').get(canViewStudentData, getReportsByStudent);

// ======================================================================

// Rule: Any logged-in user can interact with a single report by its ID.
// Permissions for editing/deleting are handled inside the controller.
router.route('/:reportId') 
    .get(protect, getReportById)
    .put(protect, updateReport)
    .delete(protect, deleteReport);

module.exports = router;