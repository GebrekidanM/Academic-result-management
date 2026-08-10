const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true,
        unique: true
    },
    code: {
        type: String,
        trim: true,
        sparse: true
    },
    gradeLevels: [{
        _id: false,
        gradeLevel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GradeLevel',
            required: true
        },
        sessionsPerWeek: {
            type: Number,
            required: true,
            default: 3,
            min: 1,
            max: 10
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);