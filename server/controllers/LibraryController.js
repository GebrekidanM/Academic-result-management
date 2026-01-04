const LibraryResource = require('../models/LibraryResources');
const { cloudinary } = require('../config/cloudinary');
const sendSystemNotification = require('../utils/sendSystemNotification');

exports.uploadResource = async (req, res) => {
    try {
        // req.files is now an object: { file: [...], cover: [...] }
        if (!req.files || !req.files['file']) {
            return res.status(400).json({ message: 'Please upload the main resource file.' });
        }

        const mainFile = req.files['file'][0];
        const coverFile = req.files['cover'] ? req.files['cover'][0] : null;

        const { title, description, type, subject, gradeLevel } = req.body;

        const resource = await LibraryResource.create({
            title,
            description,
            type,
            subject,
            gradeLevel,
            
            // Main File Data
            fileUrl: mainFile.path, 
            publicId: mainFile.filename, 
            fileType: mainFile.mimetype,

            // Cover Data (Optional)
            coverUrl: coverFile ? coverFile.path : null,
            coverPublicId: coverFile ? coverFile.filename : null,
            
            uploadedBy: req.user._id
        });


         // --- NEW: TRIGGER NOTIFICATION ---
        const typeEmoji = resource.type === 'Book' ? '📚' : '📝';
        
        await sendSystemNotification(
            `New Resource Added ${typeEmoji}`,
            `A new ${resource.type} "${resource.title}" has been uploaded for ${resource.gradeLevel} ${resource.subject}.`,
            ['parent', 'admin', 'staff'], // Who gets it
            resource.gradeLevel, // Target Grade (Parents of this grade)
            req.user._id // Sender
        );
        // ---------------------------------

        const populated = await resource.populate('uploadedBy', 'fullName');
        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Upload failed' });
    }
};

exports.deleteResource = async (req, res) => {
    try {
        const resource = await LibraryResource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: 'Not found' });

        // ... auth check ...

        // 1. Delete Main File
        if (resource.publicId) {
            const isPdf = resource.fileType === 'application/pdf';
            await cloudinary.uploader.destroy(resource.publicId, { 
                resource_type: isPdf ? 'raw' : 'image' 
            });
        }

        // 2. Delete Cover Image (If exists)
        if (resource.coverPublicId) {
            await cloudinary.uploader.destroy(resource.coverPublicId, { 
                resource_type: 'image' 
            });
        }

        await resource.deleteOne();
        res.json({ success: true, message: 'Resource removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all resources
// @route   GET /api/library
exports.getAllResources = async (req, res) => {
    try {
        // Return ALL books. Filtering happens on frontend.
        const resources = await LibraryResource.find()
            .populate('uploadedBy', 'fullName role')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: resources });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};