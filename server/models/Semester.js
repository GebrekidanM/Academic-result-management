const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Semester name is required'],
        unique: true,
        trim: true
    },
    startDate: Date,
    endDate: Date,
    isActive: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Semester', semesterSchema);
