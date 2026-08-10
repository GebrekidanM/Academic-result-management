// src/services/gradeLevelService.js
import api from './api';

const API_URL = '/gradelevels';

const gradeLevelService = {
    // @desc    Fetch all grade levels / classes
    getAllGradeLevels: async () => {
        const response = await api.get(API_URL);
        return response;
    },

    // @desc    Fetch single grade level by ID
    getGradeLevelById: async (id) => {
        const response = await api.get(`${API_URL}/${id}`);
        return response;
    },

    // @desc    Create a new grade level / class
    createGradeLevel: async (gradeLevelData) => {
        const response = await api.post(API_URL, gradeLevelData);
        return response;
    },

    // @desc    Update an existing grade level
    updateGradeLevel: async (id, gradeLevelData) => {
        const response = await api.put(`${API_URL}/${id}`, gradeLevelData);
        return response;
    },

    // @desc    Delete a grade level
    deleteGradeLevel: async (id) => {
        const response = await api.delete(`${API_URL}/${id}`);
        return response;
    }
};

export default gradeLevelService;