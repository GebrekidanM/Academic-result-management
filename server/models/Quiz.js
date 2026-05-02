const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options:[
        {
            text: { type: String, required: true },
            isCorrect: { type: Boolean, required: true, default: false }
        }
    ],
    points: { type: Number, default: 1 }
});

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    
    // Links to your existing models
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    gradeLevel: { type: String, required: true },
    academicYear: { type: String, required: true },
    
    // Quiz Settings
    durationInMinutes: { type: Number, required: true, default: 30 },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    
    // The actual questions
    questions: [questionSchema],
    
    totalMarks: { type: Number, default: 0 }
}, { timestamps: true });

// Pre-save middleware to auto-calculate total marks based on questions
quizSchema.pre('save', function(next) {
    if (this.questions && this.questions.length > 0) {
        this.totalMarks = this.questions.reduce((total, q) => total + q.points, 0);
    }
    next();
});

module.exports = mongoose.model('Quiz', quizSchema);