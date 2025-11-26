const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser,getUserProfile ,bulkCreateUsers,updateUserProfile, deleteUser, updateOtherUserProfile} = require('../controllers/userController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/upload', protect, authorize('admin','staff'), upload.single('usersFile'), bulkCreateUsers);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, authorize('admin','staff'), updateUserProfile);
    
router.put('/otherprofile/:id',protect,authorize('admin','staff'),updateOtherUserProfile)
router.get('/', protect, authorize('admin','staff'), getUsers);
router.put('/:id', protect, authorize('admin','staff'), updateUser);
router.get('/:id', protect, authorize('admin','staff'), getUserById);
router.delete('/:id', protect, authorize('admin','staff'), deleteUser);

module.exports = router;