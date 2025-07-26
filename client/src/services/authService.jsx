// src/services/authService.js
import axios from 'axios';
import api from './api';
//
const API_URL = 'https://academic-result-management.onrender.com/api/auth';

// Helper to get the teacher/admin token config
const getAuthConfig = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { headers: { Authorization: `Bearer ${user.token}` } };
    }
    return {};
};

// Public
const login = (userData) => axios.post(`${API_URL}/login`, userData);
const publicRegister = (userData) => axios.post(`${API_URL}/register/public`, userData);

// Protected (Admin-only)
const adminRegister = (userData) => {
    return api.post('/auth/register/admin', userData, getAuthConfig());
};

// Local storage functions
const logout = () => localStorage.removeItem('user');
const getCurrentUser = () => JSON.parse(localStorage.getItem('user'));

export default { login, publicRegister, adminRegister, logout, getCurrentUser };