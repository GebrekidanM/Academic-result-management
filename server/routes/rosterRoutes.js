const express = require('express');
const router = express.Router();

const { generateRoster, generateSubjectRoster } = require('../controllers/rosterController');

const {protect, isHomeroomTeacherOrAdmin, isTeacherForSubject } = require('../middleware/authMiddleware');


router.get('/', protect, isHomeroomTeacherOrAdmin, generateRoster);
router.get('/subject-details', protect, isTeacherForSubject, generateSubjectRoster);

module.exports = router;