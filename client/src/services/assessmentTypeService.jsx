// src/services/assessmentTypeService.js
import api from './api';

const API_URL = '/assessment-types';

const getBySubject = (subjectId,semester) => {
    return api.get(API_URL, { params: { subjectId, semester } });
};

const getAllAssessments = ()=>{
    return api.get(`${API_URL}/all`)
}

const create = (data) => {
    return api.post(API_URL, data);
};

const update = (id, data) => {
    return api.put(`${API_URL}/${id}`, data);
};

const remove = (id) => {
    return api.delete(`${API_URL}/${id}`);
};

export default {
    getBySubject,
    getAllAssessments,
    create,
    update,
    remove
};