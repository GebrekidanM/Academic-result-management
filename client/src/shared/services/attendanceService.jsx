import api from './api';
const API_URL = '/attendance';

const attendanceService = {
    takeAttendance: (data) => {
        return api.post(API_URL, data);
    },

    getAttendanceByClass: (gradeLevel, date) => {
        return api.get(API_URL, { 
            params: { gradeLevel, date } 
        });
    },

    getStudentAttendance: (studentId) => {
        return api.get(`${API_URL}/student/${studentId}`);
    },
    
    getAttendanceStatusByDate: (date) => {
        return api.get(`${API_URL}/status`, { params: { date } });
    }
};

export default attendanceService;