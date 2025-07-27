// src/services/studentAuthService.js
import axios from 'axios';
import api from './api';

const API_URL ='https://academic-result-management.onrender.com/api/student-auth';

// Helper to get the student/parent token config
const getStudentAuthConfig = () => {
    const studentUser = JSON.parse(localStorage.getItem('student-user'));
    if (studentUser && studentUser.token) {
        return { headers: { Authorization: `Bearer ${studentUser.token}` } };
    }
    return {};
};

// Public
const login = (studentId, password) => axios.post(`${API_URL}/login`, { studentId, password });

// Protected
const changePassword = (newPassword) => {
    return api.put('/student-auth/change-password', { newPassword }, getStudentAuthConfig());
};

// Local storage functions
const logout = () => localStorage.removeItem('student-user');
const getCurrentStudent = () => JSON.parse(localStorage.getItem('student-user'));

export default { login, changePassword, logout, getCurrentStudent };