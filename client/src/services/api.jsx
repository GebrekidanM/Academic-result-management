import axios from 'axios';
const apiUrl = import.meta.env.VITE_API_URL;
const Url = import.meta.env.VITE_URL;

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

const smallApi = axios.create({
    baseURL: Url,
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user')); // Teacher/Admin
        const studentUser = JSON.parse(localStorage.getItem('student-user')); // Parent/Student

        let token = null;

        // Prioritize the teacher/admin token if it exists
        if (user && user.token) {

            token = user.token;
        } 
        // If not, use the parent/student token if it exists
        else if (studentUser && studentUser.token) {
            token = studentUser.token;
        }

        // If we found a token, attach it to the request header
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
export { smallApi };