// src/services/userService.js
import api from './api';

const API_URL = '/users';
// Use the same helper function
const getAuthConfig = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { headers: { Authorization: `Bearer ${user.token}` } };
    }
    return {};
};

const getProfile = () => api.get('/users/profile', getAuthConfig());
const getAll = () => api.get('/users', getAuthConfig());
const getById = (id) => api.get(`/users/${id}`, getAuthConfig());
// Update a user (admin only)
const update = (id, data) => {
    // We keep your definitive fix for sending raw JSON
    const jsonData = JSON.stringify(data);
    return api.put(`${API_URL}/${id}`, jsonData, {
        headers: { 'Content-Type': 'application/json' }
    });
};

// Upload a list of users from Excel (admin only)
const uploadUsers = (file) => {
    const formData = new FormData();
    formData.append('usersFile', file);
    return api.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};


const updateProfile = (data) => {
return api.put('/users/profile', data);
};

export default {
    getProfile,
    getAll,
    getById,
    update,
    uploadUsers,
    updateProfile
};