const express = require('express');
const multer = require('multer');
const router = express.Router();
const { 
    createStudent, getStudents, getStudentById,
    updateStudent, deleteStudent, bulkCreateStudents, 
    uploadProfilePhoto, resetPassword, reRegisterStudent, getStudentForRegistration
} = require('../controllers/studentController');

const { protect, canViewStudentData, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.put('/resetpassword/:studentId', protect, resetPassword);

router.route('/')
    .post( protect, upload.fields([{ name: 'transferLetter', maxCount: 1 }, { name: 'certificate', maxCount: 1 }, { name: 'nationalId', maxCount: 1 }]), createStudent)
    .get(protect, getStudents);

router.post('/re-register', protect, reRegisterStudent);
router.get('/id/:studentId', protect, getStudentForRegistration);

router.route('/:id')
    .get(canViewStudentData, getStudentById)
    .put(protect, updateStudent)
    .delete(protect, deleteStudent);

router.post('/photo/:id', protect, upload.single('profilePhoto'), uploadProfilePhoto);

const localUpload = multer({ dest: 'uploads/' });
router.post('/upload', protect, authorize('admin', 'staff', 'accountant'), localUpload.single('studentsFile'), bulkCreateStudents);

module.exports = router;