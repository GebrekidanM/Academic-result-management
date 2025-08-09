const express = require('express');
const router = express.Router();
const { subscribe, getNotifications,markAllNotificationsAsRead} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/subscribe', protect, subscribe);
router.get('/', protect, getNotifications);
router.put('/mark-as-read', protect, markAllNotificationsAsRead);

module.exports = router;