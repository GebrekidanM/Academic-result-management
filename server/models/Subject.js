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
    },
    sessionsPerWeek: {
        type: Number,
        required: true,
        default: 3, // Default value if not specified
        min: 1,
        max: 10
    }
  }, {
    timestamps: true
});

subjectSchema.index({ name: 1, gradeLevel: 1 }, { unique: true });
module.exports = mongoose.model('Subject', subjectSchema);