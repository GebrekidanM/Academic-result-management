// backend/routes/assessmentTypeRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getAssessmentTypesBySubject,
    createAssessmentType,
    updateAssessmentType,
    deleteAssessmentType
} = require('../controllers/assessmentTypeController');

// --- Import the correct middleware ---
const { protect, isTeacherForSubject } = require('../middleware/authMiddleware');

// Anyone logged in can GET the assessment types for a subject.
router.route('/')
    .get(protect, getAssessmentTypesBySubject);

// To CREATE a new type, you must be the assigned teacher for that subject (or an admin).
router.route('/')
    .post(protect, isTeacherForSubject, createAssessmentType);

// To UPDATE or DELETE a specific type, we need a check inside the controller,
// because we don't know the subjectId from the route alone.
router.route('/:id')
    .put(protect, updateAssessmentType)
    .delete(protect, deleteAssessmentType);

module.exports = router;