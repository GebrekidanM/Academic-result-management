import api from './api';

const getAllDivisions = () => api.get('/divisions');
const getDivisionById = (id) => api.get(`/divisions/${id}`);
const createDivision = (data) => api.post('/divisions', data);
const updateDivision = (id, data) => api.put(`/divisions/${id}`, data);
const deleteDivision = (id) => api.delete(`/divisions/${id}`);
const activateDivision = (id) => api.put(`/divisions/${id}/activate`);
const calculateDivision = (score, className) => api.get('/divisions/calculate', { params: { score, className } });

const divisionService = {
    getAllDivisions,
    getDivisionById,
    createDivision,
    updateDivision,
    deleteDivision,
    activateDivision,
    calculateDivision
};

export default divisionService;
