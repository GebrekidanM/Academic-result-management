import api from './api';

const getAnalysis = (assessmentTypeId) => {
    return api.get('/analytics/assessment', {
        params: { assessmentTypeId }
    });
};

export default {
    getAnalysis
};