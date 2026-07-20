const mongoose = require('mongoose');

const teacherEvaluationSchema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model (role: 'teacher')
        required: true
    },
    evaluator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model (role: 'admin')
        required: true
    },
    academicYear: {
        type: String,
        required: true // e.g. "2018"
    },
    semester: {
        type: String,
        required: true,
        enum: ['First Semester', 'Second Semester']
    },
    
    // The 5 evaluated categories (weights sum up to 100)
    scores: {
        pedagogy: { 
            type: Number, 
            required: true, 
            min: 0, 
            max: 30, // 30% weight
            default: 0 
        },
        professionalism: { 
            type: Number, 
            required: true, 
            min: 0, 
            max: 20, // 20% weight
            default: 0 
        },
        attendance: { 
            type: Number, 
            required: true, 
            min: 0, 
            max: 20, // 20% weight
            default: 0 
        },
        studentPerformance: { 
            type: Number, 
            required: true, 
            min: 0, 
            max: 20, // 20% weight
            default: 0 
        },
        walkthroughs: { 
            type: Number, 
            required: true, 
            min: 0, 
            max: 10, // 10% weight
            default: 0 
        }
    },
    totalScore: { type: Number, min: 0, max: 100, default: 0},
    strengths: { type: String, trim: true, default: '' },
    areasOfImprovement: { type: String, trim: true, default: '' },
    generalFeedback: { type: String, trim: true, default: '' }
    
}, { timestamps: true });

teacherEvaluationSchema.pre('save', function (next) {
    const s = this.scores;
    this.totalScore = s.pedagogy + s.professionalism + s.attendance + s.studentPerformance + s.walkthroughs;
    next();
});

teacherEvaluationSchema.index({ teacher: 1, academicYear: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('TeacherEvaluation', teacherEvaluationSchema);