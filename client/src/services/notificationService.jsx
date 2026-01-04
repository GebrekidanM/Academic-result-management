import api from './api';

const getMyNotifications = () => api.get('/notifications');
const sendNotification = (data) => api.post('/notifications', data);

const deleteNotification = (id) => api.delete(`/notifications/${id}`);
const updateNotification = (id, data) => api.put(`/notifications/${id}`, data);

export default { getMyNotifications, sendNotification, deleteNotification, updateNotification };