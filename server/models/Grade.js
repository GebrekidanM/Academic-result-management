const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    assessmentType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssessmentType',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0 
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
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});


gradeSchema.pre('save', function(next) {
    if (this.isModified('assessments') || this.isNew) {
        this.finalScore = this.assessments.reduce((sum, a) => sum + (a.score || 0), 0);
    }
    next();
});

gradeSchema.index(
 { student: 1, subject: 1, semester: 1, academicYear: 1 },
 { unique: true }
);

module.exports = mongoose.model('Grade', gradeSchema);