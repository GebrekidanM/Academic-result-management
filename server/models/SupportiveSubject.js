const mongoose = require('mongoose');

const supportiveSubjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    }
}, { timestamps: true });

supportiveSubjectSchema.index({ name: 1, class: 1 }, { unique: true });

module.exports = mongoose.model('SupportiveSubject', supportiveSubjectSchema);