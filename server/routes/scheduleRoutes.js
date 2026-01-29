const express = require('express');
const router = express.Router(); 
const { 
    deleteSlot, 
    getClassSchedule, 
    assignSlot, 
    autoGenerateSchedule
} = require('../controllers/scheduleController');

const { protect, authorize } = require('../middleware/authMiddleware');
// 1. Get Schedule
router.get('/grades', protect, getClassSchedule);
// 2. Assign or Update a Slot
router.post('/assign', protect, authorize('admin'), assignSlot);
// 3. Delete a Slot
router.delete('/slot', protect, authorize('admin'), deleteSlot);
router.post('/generate',protect,authorize('admin'),autoGenerateSchedule)
module.exports = router;