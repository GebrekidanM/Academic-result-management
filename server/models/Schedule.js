const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    academicYear: { type: String, required: true },
    gradeLevel: { type: mongoose.Schema.Types.ObjectId, ref: 'GradeLevel', required: true },
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

scheduleSchema.pre('save', async function (next) {
    const Subject = mongoose.model('Subject');
    const User = mongoose.model('User');

    try {
        const subjectConfigured = await Subject.findOne({
            _id: this.subject,
            'gradeLevels.gradeLevel': this.gradeLevel
        });

        if (!subjectConfigured) {
            return next(new Error(`The subject is not assigned to this grade level.`));
        }

        const isTeacherAuthorized = await User.findOne({
            _id: this.teacher,
            role: 'teacher',
            subjectsTaught: {
                $elemMatch: {
                    subject: this.subject,
                    gradeLevel: this.gradeLevel
                }
            }
        });

        if (!isTeacherAuthorized) {
            return next(new Error(`This teacher is not authorized to teach this subject to this grade level.`));
        }

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Schedule', scheduleSchema);