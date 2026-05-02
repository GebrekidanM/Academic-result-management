import api from './api';
const API_URL = '/subjects';

// Get all subjects
const getAllSubjects = (gradeLevel) => {
    const params = gradeLevel ? { gradeLevel } : {};
    return api.get(API_URL, { params });
};

// Create a new subject
const createSubject = (subjectData) => {
    return api.post(API_URL, subjectData);
};

// Get a single subject by its ID
const getSubjectById = (id) => {
    return api.get(`${API_URL}/${id}`);
};

// Update a subject's data
const updateSubject = (id, subjectData) => {
    return api.put(`${API_URL}/${id}`, subjectData);
};

// Delete a subject
const deleteSubject = (id) => {
    return api.delete(`${API_URL}/${id}`);
};

const uploadSubjects = (file) => {
    const formData = new FormData();
    formData.append('subjectsFile', file);

    return api.post(`${API_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// Add this helper to your existing service
const getSubjectsByGrade = async (gradeLevel) => {
    // 1. Fetch all subjects (assuming you have this function)
    const res = await getAllSubjects(); 
    const allSubjects = res.data.data || res.data;
    
    // 2. Filter them locally
    return allSubjects.filter(s => s.gradeLevel === gradeLevel);
};

export default {
    getAllSubjects,
    createSubject,
    getSubjectById,
    updateSubject,
    deleteSubject,
    uploadSubjects,
    getSubjectsByGrade
};