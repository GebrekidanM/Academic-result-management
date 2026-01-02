const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadResource, getAllResources, deleteResource } = require('../controllers/LibraryController');

// Import the NEW specific middleware
const libraryUpload = require('../middleware/libraryUpload'); 

router.get('/', protect, getAllResources);

// Use 'libraryUpload' instead of the generic 'upload'
router.post('/', protect, authorize('admin', 'staff', 'teacher'), 
    libraryUpload.fields([
        { name: 'file', maxCount: 1 },  // The main document
        { name: 'cover', maxCount: 1 }  // The cover image (optional)
    ]), 
    uploadResource
);

router.delete('/:id', protect, authorize('admin', 'staff', 'teacher'), deleteResource);

module.exports = router;