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
    getClassReports: async (classId, streamId = 'all') => {
        return await api.get(`${API_URL}/class/${classId}/${streamId}`);
    },

     getCertificateData: async (classId, academicYear, streamId = 'all') => {
        const config = getConfig();
        const response = await api.get(`${API_URL}/certificate-data`, {
            ...config,
            params: { classId, streamId, academicYear }
        });
        return response.data;
    },
    getHighScorers: (academicYear) => {
        return api.get(`${API_URL}/high-scorers`, { params: { academicYear } });
    }
};

export default reportCardService;
