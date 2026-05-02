const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect, authorize ,protectStudent} = require('../middleware/authMiddleware');

// TEACHER ROUTES
router.post('/', protect, authorize('teacher'), quizController.createQuiz);
router.get('/teacher', protect, authorize('teacher'), quizController.getTeacherQuizzes);

// STUDENT ROUTES
router.get('/available', protectStudent, quizController.getAvailableQuizzes);
router.get('/:id/status', protectStudent, quizController.getQuizStatus);
router.get('/:id/take', protectStudent, quizController.getQuizToTake);
router.post('/:id/submit',protectStudent, quizController.submitQuiz);
router.get('/:id/result', protectStudent, quizController.getQuizResult);
router.get('/:id/attempts', protect, authorize('teacher'), quizController.getQuizAttemptsForTeacher);
router.get('/:id/analytics',protect,authorize('teacher'),quizController.getQuizAnalytics);
router.put('/:id',protect,authorize('teacher'),quizController.updateQuiz)
router.get('/:id/edit',protect,authorize('teacher'),quizController.getQuizForEdit)

module.exports = router;