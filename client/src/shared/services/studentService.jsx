// Student Service Module
import api from './api.jsx';

const API_URL = '/students';


const getAllStudents = () => {
    return api.get(API_URL);
};

// Get students by grade
const getStudentsByGrade = (gradeLevel) => {
    return api.get(`${API_URL}?gradeLevel=${encodeURIComponent(gradeLevel)}`);
};

const getStudentById = (id) => {
    return api.get(`${API_URL}/${id}`);
};

// ALIGNED WITH BACKEND: Search for a student by their ID for registration
const getStudentByStudentId = (studentId) => {
    return api.get(`${API_URL}/search/${studentId}`);
};

const getAllStudentsForRe = ()=>{
    return api.get(`${API_URL}/getallstudents`);
}
// Update an existing student for the new year
const reRegisterStudent = (data) => {
    return api.post(`${API_URL}/re-register`, data);
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

// For bulk import of students from an Excel file
const uploadStudents = (file) => {
    const formData = new FormData();
    formData.append('studentsFile', file);
    return api.post(`${API_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// FIXED PATH: For uploading a single student profile photo
const uploadPhoto = (studentId, file) => {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    return api.post(`${API_URL}/photo/${studentId}`, formData, {
         headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// ALIGNED WITH BACKEND: Reset password method and path
const resetPassword = (studentId) => {
    return api.post(`${API_URL}/reset/${studentId}`);
};


// --- End of Year Operations (New Endpoints) ---

// Get count of students eligible for End of Year process
const getBulkEndOfYearCount = () => {
    return api.get(`${API_URL}/bulk-end-of-year/count`);
};

// Bulk process End of Year for all eligible students
const bulkSetEndOfYearByEC = () => {
    return api.put(`${API_URL}/bulk-end-of-year`);
};

// Process End of Year for a single student
const setStudentEndOfYear = (id, statusAtEnd) => {
    return api.put(`${API_URL}/${id}/end-of-year`, { statusAtEnd });
};


// --- The final, complete export block ---
export default {
    resetPassword,
    getAllStudents,
    getAllStudentsForRe,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    uploadStudents,
    uploadPhoto,
    getStudentsByGrade,
    getStudentByStudentId,
    reRegisterStudent,
    getBulkEndOfYearCount,
    bulkSetEndOfYearByEC,
    setStudentEndOfYear
};