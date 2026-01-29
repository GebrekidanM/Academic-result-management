const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    academicYear: { type: String, required: true },
    gradeLevel: { type: String, required: true }, // e.g., "Grade 4A"
    
    dayOfWeek: { 
        type: String, 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        required: true 
    },
    
    // Period Number (1 = 1st period, 2 = 2nd period...)
    period: { type: Number, required: true, min: 1, max: 8 }, 
    
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }

}, { timestamps: true });

// PREVENT CONFLICTS:
// 1. Teacher cannot be in two places at once
scheduleSchema.index({ teacher: 1, dayOfWeek: 1, period: 1, academicYear: 1 }, { unique: true });
// 2. Class cannot have two lessons at once
scheduleSchema.index({ gradeLevel: 1, dayOfWeek: 1, period: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);