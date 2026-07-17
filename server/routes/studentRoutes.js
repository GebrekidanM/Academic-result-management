const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/bulk-end-of-year/count', protect, studentController.getBulkEndOfYearCount);
router.put('/end-of-year', protect, studentController.bulkSetEndOfYearByEC);
router.get('/search/:studentId', studentController.getStudentForRegistration);
router.post('/re-register', protect, studentController.reRegisterStudent);

router.get('/getallstudents', protect,studentController.getAllStudents);
router.post('/photo/:id', protect, studentController.uploadProfilePhoto);
router.post('/reset/:studentId', protect, studentController.resetPassword);

router.get('/', protect, studentController.getStudents);
router.post('/', protect, studentController.createStudent);
router.get('/:id', protect, studentController.getStudentById);
router.put('/:id', protect, studentController.updateStudent);
router.delete('/:id', protect, studentController.deleteStudent);

module.exports = router;