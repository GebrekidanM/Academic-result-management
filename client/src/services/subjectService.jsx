import api from './api';
const API_URL = '/subjects';

// Get all subjects
const getAllSubjects = (gradeLevel) => {
    // የክፍል ደረጃ ከተሰጠ፣ በ query parameter እንልከዋለን
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
    // 'subjectsFile' የሚለው key በጀርባ ክፍል (backend) multer ላይ ከገለጽነው ስም ጋር ተመሳሳይ መሆን አለበት
    formData.append('subjectsFile', file);

    return api.post(`${API_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

export default {
    getAllSubjects,
    createSubject,
    getSubjectById,
    updateSubject,
    deleteSubject,
    uploadSubjects
};