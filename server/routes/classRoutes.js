const express = require('express');
const router = express.Router();
const {
    createClass,
    getClasses,
    updateClass,
    deleteClass,
    createStream,
    getStreamsByClass,
    updateStream,
    deleteStream
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes (protected by login)
router.get('/', protect, getClasses);
router.get('/:classId/streams', protect, getStreamsByClass);

// Admin-only routes
router.post('/', protect, authorize('admin'), createClass);
router.put('/:id', protect, authorize('admin'), updateClass);
router.delete('/:id', protect, authorize('admin'), deleteClass);

router.post('/:classId/streams', protect, authorize('admin'), createStream);
router.put('/streams/:id', protect, authorize('admin'), updateStream);
router.delete('/streams/:id', protect, authorize('admin'), deleteStream);

module.exports = router;
