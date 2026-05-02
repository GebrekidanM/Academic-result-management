const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    score: { type: Number, required: true, default: 0 },
    percentage: { type: Number, default: 0 },
    
    // Keep track of exactly what the student answered
    studentAnswers:[
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
            selectedOptionId: { type: mongoose.Schema.Types.ObjectId },
            isCorrect: { type: Boolean, default: false }
        }
    ],
    
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    
    // Prevent multiple submissions
    isSubmitted: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure a student can only have one attempt per quiz (Remove this if you want to allow retakes)
quizAttemptSchema.index({ quiz: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);