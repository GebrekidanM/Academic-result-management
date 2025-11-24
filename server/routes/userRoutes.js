const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser,getUserProfile ,bulkCreateUsers,updateUserProfile, deleteUser} = require('../controllers/userController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/upload', protect, authorize('admin'), upload.single('usersFile'), bulkCreateUsers);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, authorize('admin'), updateUserProfile);
    
router.get('/', protect, authorize('admin'), getUsers);
router.put('/:id', protect, authorize('admin'), updateUser);
router.get('/:id', protect, authorize('admin'), getUserById);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;