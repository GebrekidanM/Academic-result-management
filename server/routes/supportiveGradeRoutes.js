const express = require('express');
const router = express.Router();
const { getGradingSheet, saveGrades, getAllSupportiveSubjects, 
    createSupportiveSubject, 
    deleteSupportiveSubject  } = require('../controllers/supportiveGradeController');
const { protect,authorize } = require('../middleware/authMiddleware');

router.get('/sheet', protect, getGradingSheet);
router.post('/save', protect, saveGrades);
router.get('/', protect, getAllSupportiveSubjects);
router.post('/', protect, authorize, createSupportiveSubject);
router.delete('/:id', protect, authorize, deleteSupportiveSubject);

module.exports = router;