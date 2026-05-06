const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
    streamName: {
        type: String,
        required: true,
        trim: true
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    }
}, { timestamps: true });

// Ensure stream names are unique within a specific class
streamSchema.index({ streamName: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('Stream', streamSchema);
