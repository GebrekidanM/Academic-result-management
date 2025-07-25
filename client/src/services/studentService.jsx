import api from './api';
const API_URL = '/students';

const uploadStudents = (file) => {
    const formData = new FormData();
    formData.append('studentsFile', file);

    return api.post('/students/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

const getAllStudents = () => {
    return api.get(API_URL);
};

const createStudent = (studentData) => {
    return api.post(API_URL, studentData);
};

// Get a single student by their ID
const getStudentById = (id) => {
    return api.get(`${API_URL}/${id}`);
};

// Update a student's data
const updateStudent = (id, studentData) => {
    return api.put(`${API_URL}/${id}`, studentData);
};

// Delete a student
const deleteStudent = (id) => {
    return api.delete(`${API_URL}/${id}`);
};

// Update the export list
export default {
    getAllStudents,
    createStudent,
    getStudentById,
    updateStudent,
    deleteStudent,
    uploadStudents
};