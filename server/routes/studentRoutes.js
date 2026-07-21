const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, canViewStudentData } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const multer = require('multer');


const studentRegistrationUpload = upload.fields([
    { name: 'transferLetter', maxCount: 1 },
    { name: 'certificate', maxCount: 1 },
    { name: 'nationalId', maxCount: 1 },
    { name: 'birthCertificate', maxCount: 1 }
]);

router.get('/bulk-end-of-year/count', protect, studentController.getBulkEndOfYearCount);
router.put('/end-of-year', protect, studentController.bulkSetEndOfYearByEC);
router.get('/search/:studentId', studentController.getStudentForRegistration);
router.post('/re-register', protect, studentController.reRegisterStudent);

router.get('/getallstudents', protect,studentController.getAllStudents);
router.post('/photo/:id', protect, upload.single('profilePhoto'), studentController.uploadProfilePhoto);
router.post('/reset/:studentId', protect, studentController.resetPassword);

const localUpload = multer({ dest: 'uploads/' });
router.post('/upload', protect, localUpload.single('studentsFile'), bulkCreateStudents);

router.get('/', protect,studentController.getStudents);
router.post('/', protect, studentRegistrationUpload, studentController.createStudent);
router.get('/:id', protect, studentController.getStudentById);
router.put('/:id', protect, studentController.updateStudent);
router.delete('/:id', protect, studentController.deleteStudent);

module.exports = router;