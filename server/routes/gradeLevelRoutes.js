const express = require('express');
const router = express.Router();
const {getGradeLevels, getGradeLevelById, createGradeLevel, updateGradeLevel, deleteGradeLevel} = require('../controllers/gradeLevelController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getGradeLevels)
    .post(protect, createGradeLevel);

router.route('/:id')
    .get(protect, getGradeLevelById)
    .put(protect, updateGradeLevel)
    .delete(protect, deleteGradeLevel);

module.exports = router;