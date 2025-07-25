// backend/models/AssessmentType.js
const mongoose = require('mongoose');

const MONTHS = [
    "September", "October", "November", "December", 
    "January", "February", "March", "April", "May", "June"
];

const assessmentTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 1
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    gradeLevel: {
        type: String,
        required: true
    },
    month: {
        type: String,
        required: [true, 'Please specify the month for this assessment'],
        enum: MONTHS
    },
    semester: {
        type: String,
        required: [true, 'Please specify the semester for this assessment'],
        enum: ['First Semester', 'Second Semester']
    }
}, {
    timestamps: true
});

// The unique index now includes the month, allowing for a "Quiz" in September and a "Quiz" in October
assessmentTypeSchema.index({ name: 1, subject: 1, gradeLevel: 1, month: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('AssessmentType', assessmentTypeSchema);