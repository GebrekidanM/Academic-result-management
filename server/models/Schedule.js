const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    academicYear: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    
    dayOfWeek: { 
        type: String, 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        required: true 
    },
    
    period: { type: Number, required: true, min: 1, max: 7 }, 
    
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }

}, { timestamps: true });

scheduleSchema.index({ teacher: 1, dayOfWeek: 1, period: 1, academicYear: 1 }, { unique: true });
scheduleSchema.index({ gradeLevel: 1, dayOfWeek: 1, period: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);