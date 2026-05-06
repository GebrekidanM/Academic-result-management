const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    
    // Who should see this?
    targetRoles: [{ 
        type: String, 
        enum: ['admin', 'teacher', 'staff', 'parent'],
        required: true
    }],
    targetClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, 
    targetStream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' }, 
    targetGrade: { type: String, default: 'All' }, // Legacy/Backup for "All" or "Primary"
    
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    expiresAt: { type: Date } // Optional: Auto-delete old news
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);