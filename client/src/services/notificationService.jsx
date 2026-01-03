import api from './api';

const getMyNotifications = () => api.get('/notifications');
const sendNotification = (data) => api.post('/notifications', data);

export default { getMyNotifications, sendNotification };