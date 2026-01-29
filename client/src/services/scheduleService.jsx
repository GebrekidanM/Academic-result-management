import api from './api';
const API_URL = '/schedule';

const scheduleService = {
    // Get schedule list
    getClassSchedule: (gradeLevel, academicYear) => {
        console.log(gradeLevel,academicYear)
        return api.get(`${API_URL}/grades`, { params: { academicYear ,gradeLevel} });
    },
    
    // Assign a teacher/subject to a slot
    assignSlot: (data) => {
        return api.post(`${API_URL}/assign`, data);
    },

    // Clear a slot
    deleteSlot: (data) => {
        return api.delete(`${API_URL}/slot`, { data });
    },
     generate: (data) => {
        // data should be { academicYear: '2018', category: 'KG' }
        return api.post(`${API_URL}/generate`, data);
    }
};

export default scheduleService;