// backend/routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const {getGradesByStudent, getGradeById,cleanBrokenAssessments , updateGrade, deleteGrade, getGradeSheet, saveGradeSheet, getGradeDetails} = require('../controllers/gradeController');
const { protect, canViewStudentData} = require('../middleware/authMiddleware');

// CLEAN ROUTE — MUST BE FIRST
router.get('/clean', cleanBrokenAssessments);

// Student routes
router.get('/student/:studentId', canViewStudentData, getGradesByStudent);
router.get('/sheet', protect, getGradeSheet);
router.post('/sheet', protect, saveGradeSheet);
router.get('/details', protect, getGradeDetails);

router.route('/:id')
    .get(protect, getGradeById)
    .put(protect, updateGrade)
    .delete(protect, deleteGrade);

module.exports = router;