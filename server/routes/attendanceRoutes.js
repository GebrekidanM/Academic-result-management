const express = require('express');
const router = express.Router();
const { takeAttendance, getAttendanceByClass, getStudentAttendance,getAttendanceStatusByDate } = require('../controllers/attendanceController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('admin', 'staff', 'teacher'), takeAttendance)
    .get(protect, authorize('admin', 'staff', 'teacher'), getAttendanceByClass);

router.route('/student/:studentId').get(protect, getStudentAttendance);
router.route('/status').get(protect, authorize('admin', 'staff'), getAttendanceStatusByDate);
module.exports = router;