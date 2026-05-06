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
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: [true, 'Class is required']
    },
    sessionsPerWeek: {
        type: Number,
        required: true,
        default: 3,
        min: 1,
        max: 10
    }
  }, {
    timestamps: true
});

subjectSchema.index({ name: 1, class: 1 }, { unique: true });
module.exports = mongoose.model('Subject', subjectSchema);