const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
    area: {
        type: String,
        required: true
    },
    result: {
        type: String,
        required: true,
        enum: ['E', 'VG', 'G', 'NI'] // Excellent, Very Good, Good, Needs Improvement
    }
}, { _id: false });

const behavioralReportSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
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
    evaluations: [evaluationSchema],
    teacherComment: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    conduct: {
        type: String
    }
}, {
    timestamps: true
});

// Prevent a student from having more than one behavioral report per semester
behavioralReportSchema.index({ student: 1, academicYear: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('BehavioralReport', behavioralReportSchema);