import api from './api';

const API_URL = '/students';

// --- Functions for Managing Student Data (CRUD) ---

const getAllStudents = () => {
    return api.get(API_URL);
};

const getStudentById = (id) => {
    return api.get(`${API_URL}/${id}`);
};

const createStudent = (studentData) => {
    return api.post(API_URL, studentData);
};

const updateStudent = (id, studentData) => {
    return api.put(`${API_URL}/${id}`, studentData, {
        headers: { 'Content-Type': 'application/json' }
    });
};

const deleteStudent = (id) => {
    return api.delete(`${API_URL}/${id}`);
};

// --- Functions for File Uploads ---

// For bulk import of students from an Excel file
const uploadStudents = (file) => {
    console.log("Uploading students file:", file);
    const formData = new FormData();
    formData.append('studentsFile', file);
    return api.post(`${API_URL}/upload`, formData,{
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// For uploading a single student profile photo
const uploadPhoto = (studentId, file) => {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    return api.post(`${API_URL}/photo/${studentId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// --- The final, complete export block ---
export default {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    uploadStudents,
    uploadPhoto
};