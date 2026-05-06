import api from './api';

const getSemesters = () => api.get('/semesters');
const createSemester = (data) => api.post('/semesters', data);
const updateSemester = (id, data) => api.put(`/semesters/${id}`, data);
const deleteSemester = (id) => api.delete(`/semesters/${id}`);

const semesterService = {
    getSemesters,
    createSemester,
    updateSemester,
    deleteSemester
};

export default semesterService;
