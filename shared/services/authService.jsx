// src/services/authService.js
import api from './api';

// Helper to get the teacher/admin token config
const getAuthConfig = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { headers: { Authorization: `Bearer ${user.token}` } };
    }
    return {};
};

// Public
const login = (userData) => api.post(`/auth/login`, userData);

// Protected (Admin-only)
const adminRegister = (userData) => {
    return api.post('/auth/register', userData, getAuthConfig());
};

// Local storage functions
const logout = () => localStorage.removeItem('user');
const getCurrentUser = () => JSON.parse(localStorage.getItem('user'));

export default { login, adminRegister, logout, getCurrentUser };