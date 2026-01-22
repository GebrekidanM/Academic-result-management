import api from './api';

const API_URL = '/report-cards';

const reportCardService = {
    getReportCardByStudent: async (studentId) => {
        return await api.get(`${API_URL}/student/${studentId}`);
    },

    // NEW: Get Whole Class
    getClassReports: async (gradeLevel) => {
        return await api.get(`${API_URL}/class/${gradeLevel}`);
    }
};

export default reportCardService;
