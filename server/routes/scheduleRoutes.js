const express = require('express');
const router = express.Router(); 
const { 
    deleteSlot, 
    getClassSchedule, 
    assignSlot, 
    autoGenerateSchedule,
    getMasterSchedule,
    getScheduleForTeacher,
    getScheduleForClass
} = require('../controllers/scheduleController');

const { protect, authorize } = require('../middleware/authMiddleware');
router.get('/grades', protect, getClassSchedule);
router.post('/assign', protect, authorize('admin'), assignSlot);
router.delete('/slot', protect, authorize('admin'), deleteSlot);
router.post('/generate',protect,authorize('admin'),autoGenerateSchedule)
router.get('/master',protect,getMasterSchedule)
router.get('/teacher',protect,authorize('teacher'),getScheduleForTeacher)
router.get('/class/:gradeLevel', protect,getScheduleForClass)


module.exports = router;