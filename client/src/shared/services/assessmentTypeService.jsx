import api from './api';
const API_URL = '/assessment-types';

const assessmentTypeService = {
    getBySubject: async (subjectId, gradeLevel, semester) => {
        const params = new URLSearchParams();
        if (subjectId) params.append('subjectId', subjectId);
        if (gradeLevel) params.append('gradeLevel', gradeLevel);
        if (semester) params.append('semester', semester);
        
        return await api.get(`${API_URL}?${params.toString()}`);
    },

    getAllAssessments : async (year,semester)=>{
        return await api.get(`${API_URL}/all`,{params:{year,semester}})
    },

    create: async (data) => {
        return await api.post(`${API_URL}`, data);
    },

    update: async (id, data) => {
        return await api.put(`${API_URL}/${id}`, data);
    },

    remove: async (id) => {
        return await api.delete(`${API_URL}/${id}`);
    }
};

export default assessmentTypeService;