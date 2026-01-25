const mongoose = require('mongoose');

const supportiveGradeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupportiveSubject',
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        enum: ['First Semester', 'Second Semester'],
        required: true
    },
    score: {
        type: String, // Stores "A", "B", "VG", "E"
        required: true
    }
}, { timestamps: true });

// Ensure a student gets only one grade per subject per semester
supportiveGradeSchema.index({ student: 1, subject: 1, semester: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('SupportiveGrade', supportiveGradeSchema);