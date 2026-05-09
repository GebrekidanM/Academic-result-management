import api from './api';

const getAllGradingScales = () => api.get('/grading-scales');
const getGradingScaleById = (id) => api.get(`/grading-scales/${id}`);
const createGradingScale = (data) => api.post('/grading-scales', data);
const updateGradingScale = (id, data) => api.put(`/grading-scales/${id}`, data);
const deleteGradingScale = (id) => api.delete(`/grading-scales/${id}`);
const activateGradingScale = (id) => api.put(`/grading-scales/${id}/activate`);
const calculateGrade = (score, className) => api.get('/grading-scales/calculate', { params: { score, className } });

const gradingScaleService = {
    getAllGradingScales,
    getGradingScaleById,
    createGradingScale,
    updateGradingScale,
    deleteGradingScale,
    activateGradingScale,
    calculateGrade
};

export default gradingScaleService;
