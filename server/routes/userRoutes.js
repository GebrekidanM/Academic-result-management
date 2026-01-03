const express = require('express');
const router = express.Router();
const { getUsersBySchoolLevel, getUserById,saveSubscription ,getTeachers ,updateUser,getUserProfile ,bulkCreateUsers,updateUserProfile, deleteUser, updateOtherUserProfile} = require('../controllers/userController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

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


const { protect, authorize } = require('../middleware/authMiddleware');
router.post('/subscribe', protectUniversal,saveSubscription);

router.post('/upload', protect, authorize('admin','staff'), upload.single('usersFile'), bulkCreateUsers);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, authorize('admin','staff'), updateUserProfile);
router.get("/teachers",protect,authorize('admin','staff'),getTeachers)
router.put('/otherprofile/:id',protect,authorize('admin','staff'),updateOtherUserProfile)
router.get('/', protect, authorize('admin','staff'), getUsersBySchoolLevel);
router.put('/:id', protect, authorize('admin','staff'), updateUser);
router.get('/:id', protect, authorize('admin','staff'), getUserById);
router.delete('/:id', protect, authorize('admin','staff'), deleteUser);

module.exports = router;