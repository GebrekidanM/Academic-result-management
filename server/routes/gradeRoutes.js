// backend/routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const {getGradesByStudent, getGradeById,cleanBrokenAssessments , updateGrade, deleteGrade, getGradeSheet, saveGradeSheet, getGradeDetails, uploadPdfGrades} = require('../controllers/gradeController');
const { protect, canViewStudentData} = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// CLEAN ROUTE — MUST BE FIRST
router.get('/clean', cleanBrokenAssessments);

// Student routes
router.get('/student/:studentId', canViewStudentData, getGradesByStudent);
router.get('/sheet', protect, getGradeSheet);
router.post('/sheet', protect, saveGradeSheet);
router.post('/upload-pdf', protect, upload.single('pdf'), uploadPdfGrades);
router.get('/details', protect, getGradeDetails);

router.route('/:id')
    .get(protect, getGradeById)
    .put(protect, updateGrade)
    .delete(protect, deleteGrade);

module.exports = router;