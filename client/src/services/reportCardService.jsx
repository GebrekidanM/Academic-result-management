//report card service
import api from './api';

// The base URL for the report cards resource.
const API_URL = '/report-cards';

/**
 * Fetches the report card for a specific student.
 */
const getReportCardByStudent = (id) => {
    return api.get(`${API_URL}/student/${id}`);
};

/** export */
export default {
    getReportCardByStudent
};
