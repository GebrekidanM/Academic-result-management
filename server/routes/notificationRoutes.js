const express = require('express');
const router = express.Router();
const { subscribe, getNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/subscribe', protect, subscribe);
router.get('/', protect, getNotifications);

module.exports = router;