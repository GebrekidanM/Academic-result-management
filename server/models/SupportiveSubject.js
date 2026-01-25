const mongoose = require('mongoose');

const supportiveSubjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    gradeLevel: {
        type: String,
        required: true
    }
}, { timestamps: true });

supportiveSubjectSchema.index({ name: 1, gradeLevel: 1 }, { unique: true });

module.exports = mongoose.model('SupportiveSubject', supportiveSubjectSchema);