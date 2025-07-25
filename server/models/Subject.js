const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true
    },
    code: {
        type: String,
        trim: true,
        sparse: true
    },
    gradeLevel: {
        type: String,
        required: [true, 'Grade level is required']
    }
}, {
    timestamps: true
});

subjectSchema.index({ name: 1, gradeLevel: 1 }, { unique: true });
module.exports = mongoose.model('Subject', subjectSchema);