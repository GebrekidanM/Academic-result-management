const express = require('express');
const router = express.Router();
const { protect, protectStudent, authorize } = require('../middleware/authMiddleware');
const { createNotification, getMyNotifications, updateNotification, deleteNotification } = require('../controllers/notificationController');

// --- MIDDLEWARE TO ALLOW BOTH USERS AND STUDENTS ---
const protectUniversal = async (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ message: "Not Authorized" });
    }

    try {
        await protect(req, res, () => {});
        if (req.user) {
            return next();
        }
    } catch (e) {
        console.log("User token failed, trying student token...");
    }

    // If protect() already sent a response, stop here
    if (res.headersSent) return;

    try {
        await protectStudent(req, res, () => {});
        if (req.student) {
            req.user = { ...req.student.toObject(), role: "parent" };
            return next();
        }
    } catch (e) {
        console.log("Student token failed.");
    }

    if (!res.headersSent) {
        return res.status(401).json({ message: "Not Authorized" });
    }
};
// Routes
router.get('/', protectUniversal, getMyNotifications);
router.post('/', protect, authorize('admin', 'staff'), createNotification);
router.route('/:id')
    .put(protect, authorize('admin', 'staff'), updateNotification)
    .delete(protect, authorize('admin', 'staff'), deleteNotification);
module.exports = router;