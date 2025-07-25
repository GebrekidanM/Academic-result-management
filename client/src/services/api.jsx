import axios from 'axios';

const api = axios.create({
    baseURL: 'https://academic-result-management.onrender.com/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- THIS IS THE DEFINITIVE, GUARANTEED INTERCEPTOR ---
api.interceptors.request.use(
    (config) => {
        // We will try to get both potential users from localStorage
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