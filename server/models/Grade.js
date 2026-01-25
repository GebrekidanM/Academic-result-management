// backend/models/Grade.js
const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    assessmentType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssessmentType',
        required: true
    },
    score: {
        type: Number,
        required: true
    }
}, { _id: false });

const gradeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student', 
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
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
    assessments: [assessmentSchema],
    finalScore: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

gradeSchema.index(
  { student: 1, subject: 1, semester: 1, academicYear: 1, "assessments.assessmentType": 1 },
  { unique: false } 
);

module.exports = mongoose.model('Grade', gradeSchema);