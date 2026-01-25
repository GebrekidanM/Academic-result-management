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
    },
    getAll: () => api.get(API_URL),
    create: (data) => api.post(API_URL, data),
    delete: (id) => api.delete(`${API_URL}/${id}`)
};

export default supportiveGradeService;