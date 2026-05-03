const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Student = require('../models/Student')
// ==========================================
// TEACHER CONTROLLERS
// ==========================================

// @desc    Create a new Quiz
// @route   POST /api/quizzes
exports.createQuiz = async (req, res) => {
    try {
        // Assume req.user contains the authenticated teacher's info
        const teacherId = req.user._id; 
        
        const newQuiz = new Quiz({
            ...req.body,
            teacher: teacherId
        });

        const savedQuiz = await newQuiz.save();
        res.status(201).json({ success: true, data: savedQuiz });
    } catch (error) {
        console.error("Create Quiz Error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all quizzes created by a specific teacher
// @route   GET /api/quizzes/teacher
exports.getTeacherQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ teacher: req.user._id })
            .populate('subject', 'name')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// ==========================================
// STUDENT CONTROLLERS
// ==========================================
// @desc    Check if a student has already taken a quiz
// @route   GET /api/quizzes/:id/status
exports.getQuizStatus = async (req, res) => {
    try {
        const studentId = req.student ? req.student._id : req.user._id;
        const attempt = await QuizAttempt.findOne({ quiz: req.params.id, student: studentId });

        res.status(200).json({ 
            success: true, 
            hasTaken: !!attempt, // true if they took it, false if new
            data: attempt ? { score: attempt.score, percentage: attempt.percentage } : null
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Get available quizzes for a student's grade level
// @route   GET /api/quizzes/available
exports.getAvailableQuizzes = async (req, res) => {
    try {
        const { gradeLevel, academicYear } = req.query;

        // Find active quizzes for this grade
        const quizzes = await Quiz.find({ 
            gradeLevel, 
            academicYear, 
            isActive: true 
        }).populate('subject', 'name').select('-questions'); // Don't send questions in the list view

        res.status(200).json({ success: true, data: quizzes });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single quiz to TAKE IT (Hides correct answers)
// @route   GET /api/quizzes/:id/take
exports.getQuizToTake = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).lean();

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // SECURITY: Remove "isCorrect" from the options so students can't cheat
        const securedQuestions = quiz.questions.map(q => {
            return {
                ...q,
                options: q.options.map(opt => ({
                    _id: opt._id,
                    text: opt.text
                }))
            };
        });

        quiz.questions = securedQuestions;

        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit a Quiz & Auto-Grade
// @route   POST /api/quizzes/:id/submit
exports.submitQuiz = async (req, res) => {
    try {
        const quizId = req.params.id;
        const studentId = req.student._id;
        const { answers } = req.body;
        

        // 1. Check if student already submitted this quiz
        const existingAttempt = await QuizAttempt.findOne({ quiz: quizId, student: studentId });
        if (existingAttempt && existingAttempt.isSubmitted) {
            return res.status(400).json({ message: 'You have already completed this quiz.' });
        }

        // 2. Fetch the original quiz WITH the correct answers from DB
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        
        
        let totalScore = 0;
        const gradedAnswers = answers.map(answer => {
            const question = quiz.questions.id(answer.questionId);
            const correctOption = question.options.find(opt => opt.isCorrect === true);
            
            const isCorrect = correctOption && String(correctOption._id) === String(answer.selectedOptionId);
            
            if (isCorrect) {
                totalScore += question.points;
            }

            return {
                questionId: answer.questionId,
                selectedOptionId: answer.selectedOptionId,
                isCorrect: isCorrect
            };
        });

        // 3. Save the result
        const attempt = new QuizAttempt({
            quiz: quizId,
            student: studentId,
            score: totalScore,
            percentage: (totalScore / quiz.totalMarks) * 100,
            studentAnswers: gradedAnswers,
            isSubmitted: true,
            completedAt: new Date()
        });

        await attempt.save();

        res.status(200).json({ 
            success: true, 
            data: { 
                score: totalScore, 
                totalMarks: quiz.totalMarks,
                percentage: (totalScore / quiz.totalMarks) * 100
            } 
        });

    } catch (error) {
        console.error("Submit Quiz Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Quiz Result for a student
// @route   GET /api/quizzes/:id/result
exports.getQuizResult = async (req, res) => {
    try {
        const studentId = req.student ? req.student._id : req.user._id;
        
        // Populate the Quiz document so we can see the Questions/Options
        const attempt = await QuizAttempt.findOne({ 
            quiz: req.params.id, 
            student: studentId 
        }).populate('quiz'); 

        if (!attempt) return res.status(404).json({ message: 'Result not found' });

        res.status(200).json({ success: true, data: attempt });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Add this to controllers/quizController.js
exports.getQuizAttemptsForTeacher = async (req, res) => {
    try {
        const quizId = req.params.id;
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // 1. Get all attempts
        const attempts = await QuizAttempt.find({ quiz: quizId })
            .populate('student', 'fullName studentId');

        // 2. Get ALL students in that grade
        const allStudents = await Student.find({ gradeLevel: quiz.gradeLevel })
            .select('fullName studentId');

        // 3. Find who hasn't taken it
        const attemptedIds = attempts.map(a => a.student._id.toString());
        const notTaken = allStudents.filter(s => !attemptedIds.includes(s._id.toString()));

        res.status(200).json({ 
            success: true, 
            data: { attempts, notTaken, quiz } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getQuizAnalytics = async (req, res) => {
    try {
        const quizId = req.params.id;
        const attempts = await QuizAttempt.find({ quiz: quizId });
        const quiz = await Quiz.findById(quizId);

        if (!attempts.length) return res.status(200).json({ success: true, data: [] });

        // Create a map to store stats for each question
        const questionStats = {};

        attempts.forEach(attempt => {
            attempt.studentAnswers.forEach(ans => {
                if (!questionStats[ans.questionId]) {
                    questionStats[ans.questionId] = { correct: 0, total: 0 };
                }
                questionStats[ans.questionId].total += 1;
                if (ans.isCorrect) questionStats[ans.questionId].correct += 1;
            });
        });

        // Combine with original quiz question text
        const analysis = quiz.questions.map(q => {
            const stats = questionStats[q._id.toString()] || { correct: 0, total: 0 };
            return {
                questionText: q.questionText,
                correctCount: stats.correct,
                incorrectCount: stats.total - stats.correct,
                successRate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
            };
        });

        res.status(200).json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET quiz for editing (This one includes correct answers, only for Teachers)
exports.getQuizForEdit = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// PUT update quiz
exports.updateQuiz = async (req, res) => {
    try {
        const updatedQuiz = await Quiz.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        res.status(200).json({ success: true, data: updatedQuiz });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteQuiz = async (req,res) => {
    try{
        const quizId = req.params.id
        await QuizAttempt.deleteMany({ quiz:quizId})
        const deletedQuiz = await Quiz.findByIdAndDelete(quizId)
        
        if(!deletedQuiz){
            return res.status(404).json({message: "Not found"})
        }
        res.status(200).json({success:true})
    } catch(error){
        res.status(500).json({message: "Server Error"})
    }
}