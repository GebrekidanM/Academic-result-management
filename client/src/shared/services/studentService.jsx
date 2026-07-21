// Student Service Module
import api from './api.jsx';

const API_URL = '/students';


const getAllStudents = () => {
    return api.get(API_URL);
};

const getStudentsByGrade = (gradeLevel) => {
    return api.get(`${API_URL}?gradeLevel=${encodeURIComponent(gradeLevel)}`);
};

const getStudentById = (id) => {
    return api.get(`${API_URL}/${id}`);
};

const getStudentByStudentId = (studentId) => {
    return api.get(`${API_URL}/search/${studentId}`);
};

const getAllStudentsForRe = ()=>{
    return api.get(`${API_URL}/getallstudents`);
}

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

const uploadStudents = (file) => {
    const formData = new FormData();
    formData.append('studentsFile', file);
    formData.append('year', year);
    
    return api.post(`${API_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

const uploadPhoto = (studentId, file) => {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    return api.post(`${API_URL}/photo/${studentId}`, formData, {
         headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

const resetPassword = (studentId) => {
    return api.post(`${API_URL}/reset/${studentId}`);
};

const getBulkEndOfYearCount = () => {
    return api.get(`${API_URL}/bulk-end-of-year/count`);
};

const bulkSetEndOfYearByEC = () => {
    return api.put(`${API_URL}/bulk-end-of-year`);
};

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