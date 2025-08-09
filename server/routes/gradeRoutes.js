// backend/routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const {getGradesByStudent, getGradeById, updateGrade, deleteGrade, getGradeSheet, saveGradeSheet, getGradeDetails } = require('../controllers/gradeController');
const { protect, isTeacherForSubject, canViewStudentData} = require('../middleware/authMiddleware');


// THIS IS THE CRITICAL ROUTE. Make sure the path is correct.
// Route to get all grades for a specific student. Any logged-in user can view this.
router.route('/student/:studentId').get(canViewStudentData, getGradesByStudent);
router.get('/sheet', protect, getGradeSheet);
router.post('/sheet', protect, saveGradeSheet);
router.get('/details', protect, getGradeDetails);
// Routes to interact with a single grade record by its own ID
router.route('/:id')
    .get(protect, getGradeById)
    .put(protect, updateGrade)
    .delete(protect, deleteGrade);

module.exports = router;