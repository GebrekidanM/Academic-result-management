import api from './api';

const API_URL = '/report-cards';

const getReportCardByStudent = (id) => {
    return api.get(`${API_URL}/student/${id}`);
};

export default {
    getReportCardByStudent
};
