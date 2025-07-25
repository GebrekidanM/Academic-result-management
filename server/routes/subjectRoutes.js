const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

const { 
    createSubject, 
    getSubjects, 
    getSubjectById, 
    updateSubject, 
    deleteSubject,
    bulkCreateSubjects
} = require('../controllers/subjectController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Rule: Any user who is logged in can GET the list of subjects.
router.get('/', protect, getSubjects);
router.get('/:id', protect, getSubjectById);

// Rule: ONLY an ADMIN can CREATE, UPDATE, or DELETE a subject.
router.post('/', protect, authorize('admin'), createSubject);
router.put('/:id', protect, authorize('admin'), updateSubject);
router.delete('/:id', protect, authorize('admin'), deleteSubject);
router.post('/upload', protect, authorize('admin'), upload.single('subjectsFile'), bulkCreateSubjects);

module.exports = router;