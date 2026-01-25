import api from './api';
const API_URL = '/supportive-grades';

const supportiveGradeService = {
    getSheet: (gradeLevel, academicYear, semester) => {
        return api.get(`${API_URL}/sheet`, { 
            params: { gradeLevel, academicYear, semester } 
        });
    },
    saveGrades: (data) => {
        return api.post(`${API_URL}/save`, data);
    }
};

export default supportiveGradeService;