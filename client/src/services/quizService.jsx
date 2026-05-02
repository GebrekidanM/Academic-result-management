import api from './api';

const API_URL = '/quizzes/';

// Get all available quizzes for the student
const getAvailableQuizzes = (gradeLevel, academicYear) => {
    return api.get(`${API_URL}available`, {
        params: { gradeLevel, academicYear }
    });
};
const getQuizStatus = (quizId) => {
    return api.get(`${API_URL}${quizId}/status`)
};

// Fetch quiz data (without answers) to display to student
const getQuizToTake = (quizId) => {
    return api.get(`${API_URL}${quizId}/take`);
};

// Submit student answers
const submitQuiz = (quizId, answers) => {
    return api.post(`${API_URL}${quizId}/submit`, { answers });
};

// Fetch results after submission
const getQuizResult = (quizId) => {
    return api.get(`${API_URL}${quizId}/result`);
};

// Teacher: Create a new quiz
const createQuiz = (quizData) => {
    return api.post(API_URL, quizData);
};
const getTeacherQuizzes =() =>{
    return api.get(`${API_URL}teacher`);
}

const getQuizAttempts = (id) => api.get(`${API_URL}${id}/attempts`);

const getQuizAnalytics = (quizId) => {
    return api.get(`${API_URL}${quizId}/analytics`);
};

const getQuizForEdit = (quizId) => {
    return api.get(`${API_URL}${quizId}/edit`);
};

const updateQuiz = (quizId, quizData) => {
    return api.put(`${API_URL}${quizId}`, quizData);
};

const quizService = {
    getQuizForEdit,
    updateQuiz,
    getAvailableQuizzes,
    getQuizToTake,
    submitQuiz,
    getQuizResult,
    getTeacherQuizzes,
    createQuiz,
    getQuizAnalytics,
    getQuizStatus,
    getQuizAttempts
};

export default quizService;