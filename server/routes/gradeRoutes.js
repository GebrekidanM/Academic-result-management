// backend/routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const { addGrade, getGradesByStudent, getGradeById, updateGrade, deleteGrade } = require('../controllers/gradeController');
const { protect, isTeacherForSubject, canViewStudentData} = require('../middleware/authMiddleware');

// Route to create a new grade. Protected by teacher assignment.
router.route('/')
    .post(protect, isTeacherForSubject, addGrade);

// THIS IS THE CRITICAL ROUTE. Make sure the path is correct.
// Route to get all grades for a specific student. Any logged-in user can view this.
router.route('/student/:studentId').get(canViewStudentData, getGradesByStudent);

// Routes to interact with a single grade record by its own ID
router.route('/:id')
    .get(protect, getGradeById)
    .put(protect, updateGrade) // Controller-level checks will handle permissions
    .delete(protect, deleteGrade); // Controller-level checks will handle permissions

module.exports = router;