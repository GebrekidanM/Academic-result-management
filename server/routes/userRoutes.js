const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser,getUserProfile ,bulkCreateUsers,updateUserProfile} = require('../controllers/userController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/upload', protect, authorize('admin'), upload.single('usersFile'), bulkCreateUsers);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);
    
router.get('/', protect, authorize('admin'), getUsers);// GET /api/users - Protected and only for Admins
router.put('/:id', protect, authorize('admin'), updateUser);// PUT /api/users/:id - Protected and only for Admins
router.get('/:id', protect, authorize('admin'), getUserById);// GET /api/users/:id - Protected and only for Admins



module.exports = router;