import axios from 'axios';

const api = axios.create({
    baseURL:'https://academic-result-management.onrender.com/api' ,//'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

exports.smallApi = axios.create({
    baseURL:'https://academic-result-management.onrender.com/' ,
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