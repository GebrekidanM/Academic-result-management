const mongoose = require('mongoose');

const globalConfigSchema = new mongoose.Schema({
    currentAcademicYear: {
        type: String,
        default: '2026'
    },
    currentSemester: {
        type: String,
        default: 'First Semester'
    },
    schoolName: {
        type: String,
        default: 'My School'
    }
}, { timestamps: true });

module.exports = mongoose.model('GlobalConfig', globalConfigSchema);
