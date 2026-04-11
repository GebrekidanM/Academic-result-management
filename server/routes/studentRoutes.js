// backend/routes/studentRoutes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { 
    createStudent, getStudents, getStudentById,
    updateStudent, deleteStudent, bulkCreateStudents, 
    uploadProfilePhoto, resetPassword,reRegisterStudent,getStudentForRegistration
} = require('../controllers/studentController');


const { protect, canViewStudentData } = require('../middleware/authMiddleware');

const upload = require('../middleware/upload');

router.get('/resetpassword/:studentId',protect, resetPassword)

router.route('/')
    .post(protect, createStudent)
    .get(protect, getStudents);

router.post('/re-register',reRegisterStudent)

router.get('/id/:studentId',getStudentForRegistration)

router.route('/:id')
    .get(canViewStudentData, getStudentById)
    .put(protect, updateStudent)
    .delete(protect, deleteStudent);

// --- THE DEFINITIVE PHOTO UPLOAD ROUTE ---
router.post('/photo/:id', protect, upload.single('profilePhoto'), uploadProfilePhoto);

// --- The Excel upload route (we'll keep it simple for now) ---
const localUpload = multer({ dest: 'uploads/' });
router.post('/upload', protect, localUpload.single('studentsFile'), bulkCreateStudents);

module.exports = router;