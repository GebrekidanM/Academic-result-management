const mongoose = require('mongoose');

const libraryResourceSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String },
    type: { 
        type: String, 
        enum: ['Book', 'Teacher Note', 'Worksheet', 'Other'], 
        default: 'Book' 
    },
    subject: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    
    // --- Main File ---
    fileUrl: { type: String, required: true },
    publicId: { type: String }, // For deletion
    fileType: { type: String },

    // --- Cover Image (New) ---
    coverUrl: { type: String }, 
    coverPublicId: { type: String }, // For deletion
    
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('LibraryResource', libraryResourceSchema);