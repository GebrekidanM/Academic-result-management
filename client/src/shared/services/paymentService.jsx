import api from './api';

const API_URL = '/payments';

const paymentService = {
    createPayment: (data) => {
        return api.post(API_URL, data);
    },

    getStudentPaymentHistory: (studentId) => {
        return api.get(`${API_URL}/student/${studentId}`);
    },

    getAllPayments: (filters = {}) => {
        return api.get(API_URL, { params: filters });
    },
    getPaymentAnalytics : (filters) => {
        return api.get(`${API_URL}/analytics`, { params: filters });
    }
};
export default paymentService;