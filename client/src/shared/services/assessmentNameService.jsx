import api from './api';

const assessmentNameService = {
    getAllNames: () => {
        return api.get('/assessment-names');
    },

    createName: (data) => {
        return api.post('/assessment-names', data);
    },

    updateName: (id, data) => {
        return api.put(`/assessment-names/${id}`, data);
    },

    deleteName: (id) => {
        return api.delete(`/assessment-names/${id}`);
    }
};

export default assessmentNameService;
