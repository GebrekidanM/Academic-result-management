const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    gradeLevel: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    records: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true
        },
        status: {
            type: String,
            enum: ['Present', 'Absent', 'Late', 'Excused'],
            default: 'Present'
        }
    }],
    takenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

attendanceSchema.index({ gradeLevel: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);