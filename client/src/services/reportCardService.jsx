import api from './api';

const API_URL = '/report-cards';

const getConfig = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    return {
        headers: {
            Authorization: `Bearer ${user?.token}`,
        },
    };
};

const reportCardService = {
    getReportCardByStudent: async (studentId) => {
        return await api.get(`${API_URL}/student/${studentId}`);
    },

    // NEW: Get Whole Class
    getClassReports: async (gradeLevel) => {
        return await api.get(`${API_URL}/class/${gradeLevel}`);
    },

     getCertificateData: async (gradeLevel, academicYear) => {
        const config = getConfig();
        const response = await api.get(`${API_URL}/certificate-data`, {
            ...config,
            params: { gradeLevel, academicYear }
        });
        return response.data;
    },
    getHighScorer: async ( academicYear) => {
        const config = getConfig();
        const response = await api.get(`${API_URL}/high-scorer`, {
            ...config,
            params: {academicYear }
        });
        return response.data;
    }
};

export default reportCardService;
