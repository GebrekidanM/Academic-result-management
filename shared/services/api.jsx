import axios from 'axios';

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


export default api;
export { smallApi };
