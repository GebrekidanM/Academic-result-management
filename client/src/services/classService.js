import api from './api';

const API_URL = '/classes';

const getClasses = () => {
    return api.get(API_URL);
};

const getStreamsByClass = (classId) => {
    return api.get(`${API_URL}/${classId}/streams`);
};

const createClass = (classData) => {
    return api.post(API_URL, classData);
};

const updateClass = (id, classData) => {
    return api.put(`${API_URL}/${id}`, classData);
};

const deleteClass = (id) => {
    return api.delete(`${API_URL}/${id}`);
};

const createStream = (classId, streamData) => {
    return api.post(`${API_URL}/${classId}/streams`, streamData);
};

const updateStream = (id, streamData) => {
    return api.put(`${API_URL}/streams/${id}`, streamData);
};

const deleteStream = (id) => {
    return api.delete(`${API_URL}/streams/${id}`);
};

const classService = {
    getClasses,
    getStreamsByClass,
    createClass,
    updateClass,
    deleteClass,
    createStream,
    updateStream,
    deleteStream
};

export default classService;
