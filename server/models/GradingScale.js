const mongoose = require('mongoose');

const gradeRangeSchema = new mongoose.Schema({
    grade: { type: String, required: true },
    minScore: { type: Number, required: true },
    maxScore: { type: Number, required: true }
}, { _id: false });

const gradingScaleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        default: 'Primary P4-P7'
    },
    schoolLevel: {
        type: String,
        required: true,
        enum: ['kg', 'primary', 'High School', 'all'],
        default: 'primary'
    },
    applicableClasses: {
        type: [String],
        default: ['P4', 'P5', 'P6', 'P7']
    },
    ranges: {
        type: [gradeRangeSchema],
        required: true,
        default: [
            { grade: '1', minScore: 90, maxScore: 100 },
            { grade: 'D2', minScore: 80, maxScore: 89 },
            { grade: 'C3', minScore: 70, maxScore: 79 },
            { grade: 'C4', minScore: 60, maxScore: 69 },
            { grade: 'C5', minScore: 50, maxScore: 59 },
            { grade: 'C6', minScore: 45, maxScore: 49 },
            { grade: 'P7', minScore: 40, maxScore: 44 },
            { grade: 'P8', minScore: 35, maxScore: 39 },
            { grade: 'F9', minScore: 0, maxScore: 34 }
        ]
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('GradingScale', gradingScaleSchema);
