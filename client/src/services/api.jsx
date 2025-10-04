import axios from 'axios';
import { queueRequest, processQueue, saveToCache, getFromCache } from './offlineDB';

const apiUrl = import.meta.env.VITE_API_URL;
const Url = import.meta.env.VITE_URL;

const api = axios.create({
  baseURL: apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

const smallApi = axios.create({
  baseURL: Url,
  headers: { 'Content-Type': 'application/json' },
});

// 🔹 Add token to every request
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const studentUser = JSON.parse(localStorage.getItem('student-user'));
    const token = user?.token || studentUser?.token;
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Handle offline behavior automatically
api.interceptors.response.use(
  async (response) => {
    // Cache GET responses for offline display
    if (response.config.method === 'get') {
      const key = response.config.url;
      await saveToCache(key, response.data);
    }
    return response;
  },
  async (error) => {
    const { config } = error;

    // If no internet connection
    if (!navigator.onLine) {
      console.warn('⚠️ Offline detected. Queuing request:', config.url);

      if (['post', 'put', 'delete'].includes(config.method)) {
        await queueRequest(config.url, config.method, config.data ? JSON.parse(config.data) : {});
      } else if (config.method === 'get') {
        const cachedData = await getFromCache(config.url);
        if (cachedData) {
          console.log('📦 Loaded cached data for:', config.url);
          return Promise.resolve({ data: cachedData });
        }
      }

      return Promise.resolve({ data: { offline: true, message: 'You are offline. Data will sync later.' } });
    }

    return Promise.reject(error);
  }
);

// 🔹 Sync queued requests when online again
window.addEventListener('online', () => {
  console.log('🌐 Back online! Syncing queued requests...');
  processQueue();
});

export default api;
export { smallApi };
