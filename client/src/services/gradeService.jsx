import api from './api';
const API_URL = '/grades';


// Get all grade entries for a specific student
const getGradesByStudent = (studentId) => {
    return api.get(`${API_URL}/student/${studentId}`);
};

/**
 * Fetches a single grade entry by its own ID.
 * Used in: EditGradePage (to load initial form data)
 * @param {string} gradeId - The ID of the grade entry.
 * @returns {Promise} Axios promise
 */
const getGradeById = (gradeId) => {
    return api.get(`${API_URL}/${gradeId}`);
};

// Create a new grade entry
const createGrade = (gradeData) => {
    return api.post(API_URL, gradeData);
};
const deleteGrade = (gradeId) => {
    return api.delete(`${API_URL}/${gradeId}`);
};
const updateGrade = (gradeId, gradeData) => {
    return api.put(`${API_URL}/${gradeId}`, gradeData); 
};

const getGradeSheet = (assessmentTypeId) => {
    return api.get('/grades/sheet', { params: { assessmentTypeId } });
};

const saveGradeSheet = (data) => {
    return api.post('/grades/sheet', data);
};

const getGradeDetails = ({ studentId, subjectId, semester, academicYear }) => {
    return api.get(`${API_URL}/details`, {
        params: { studentId, subjectId, semester, academicYear }
    });
};

export default { getGradesByStudent, createGrade,deleteGrade, getGradeById, updateGrade, getGradeSheet, saveGradeSheet  ,getGradeDetails };