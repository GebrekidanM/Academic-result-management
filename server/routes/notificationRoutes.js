const express = require('express');
const router = express.Router();
const { protect, protectStudent, authorize } = require('../middleware/authMiddleware');
const { createNotification, getMyNotifications, updateNotification, deleteNotification } = require('../controllers/notificationController');

// --- MIDDLEWARE TO ALLOW BOTH USERS AND STUDENTS ---
const protectUniversal = async (req, res, next) => {
    if (req.headers.authorization) {
        try {
            await protect(req, res, () => {}); // Try protect
            if (req.user) return next(); // Success
        } catch (e) {
            console.log("User token failed, trying student token...");
        } 
        
        try {
            await protectStudent(req, res, () => {}); // Try protectStudent
            if (req.student) {
                req.user = { ...req.student.toObject(), role: 'parent' }; 
                return next();
            }
        } catch (e) {
            console.log("Student token failed.");
        }
    }
    return res.status(401).json({ message: "Not Authorized" });
};

// Routes
router.get('/', protectUniversal, getMyNotifications);
router.post('/', protect, authorize('admin', 'staff'), createNotification);
router.route('/:id')
    .put(protect, authorize('admin', 'staff'), updateNotification)
    .delete(protect, authorize('admin', 'staff'), deleteNotification);
module.exports = router;