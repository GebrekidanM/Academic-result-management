import api from './api';
const getStats = () => api.get('/dashboard/stats');
export default { getStats };