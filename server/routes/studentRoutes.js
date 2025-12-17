// backend/routes/studentRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { 
    createStudent, getStudents, getStudentById,
    updateStudent, deleteStudent, bulkCreateStudents, 
    uploadProfilePhoto, resetPassword
} = require('../controllers/studentController');


const { protect, canViewStudentData } = require('../middleware/authMiddleware');

// Import the main multer instance we just created
const upload = require('../middleware/upload');

router.get('/resetpassword/:studentId',protect, resetPassword)

// Standard JSON routes
router.route('/')
    .post(protect, createStudent)
    .get(protect, getStudents);

router.route('/:id')
    .get(canViewStudentData, getStudentById)
    .put(protect, updateStudent)
    .delete(protect, deleteStudent);

// --- THE DEFINITIVE PHOTO UPLOAD ROUTE ---
// We call upload.single() right here. This is the clearest and most direct way.
router.post('/photo/:id', protect, upload.single('profilePhoto'), uploadProfilePhoto);

// --- The Excel upload route (we'll keep it simple for now) ---
const localUpload = multer({ dest: 'uploads/' });
router.post('/upload', protect, localUpload.single('studentsFile'), bulkCreateStudents);

module.exports = router;