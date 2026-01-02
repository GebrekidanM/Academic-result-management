import api from './api';

const getAll = () => {

   return api.get('/library')
};

const upload = (formData) => {
    return api.post('/library', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
};

const remove = (id) => api.delete(`/library/${id}`);

export default { getAll, upload, remove };