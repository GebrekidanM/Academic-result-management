// backend/routes/studentRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { 
    createStudent, getStudents, getStudentById,
    updateStudent, deleteStudent, bulkCreateStudents, 
    uploadProfilePhoto
} = require('../controllers/studentController');


const { protect, authorize, canViewStudentData , isHomeroomTeacherOrAdmin} = require('../middleware/authMiddleware');

// Import the main multer instance we just created
const upload = require('../middleware/upload');

// Standard JSON routes
router.route('/')
    .post(protect, authorize('admin' || ""), createStudent)
    .get(protect, getStudents);

router.route('/:id')
    .get(canViewStudentData, getStudentById)
    .put(protect, authorize('admin'),isHomeroomTeacherOrAdmin, updateStudent)
    .delete(protect, authorize('admin'),isHomeroomTeacherOrAdmin, deleteStudent);

// --- THE DEFINITIVE PHOTO UPLOAD ROUTE ---
// We call upload.single() right here. This is the clearest and most direct way.
router.post('/photo/:id', protect, isHomeroomTeacherOrAdmin,authorize('admin'), upload.single('profilePhoto'), uploadProfilePhoto);

// --- The Excel upload route (we'll keep it simple for now) ---
const localUpload = multer({ dest: 'uploads/' });
router.post('/upload', protect, authorize('admin'), isHomeroomTeacherOrAdmin,localUpload.single('studentsFile'), bulkCreateStudents);

module.exports = router;