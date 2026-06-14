import api from './api';
const API_URL = '/ranks';

const rankService = {
    // 1. Get Summary Rank (S1, S2, Overall) - The function you were missing
    getRankByStudent: async (studentId, gradeLevel, academicYear) => {
        try {
            const [s1, s2, overall] = await Promise.allSettled([
                api.get(`${API_URL}/class-rank/${studentId}`, { 
                    params: { gradeLevel, academicYear, semester: 'First Semester' } 
                }),
                api.get(`${API_URL}/class-rank/${studentId}`, { 
                    params: { gradeLevel, academicYear, semester: 'Second Semester' } 
                }),
                api.get(`${API_URL}/overall-rank/${studentId}`, { 
                    params: { gradeLevel, academicYear } 
                })
            ]);

            return {
                sem1: s1.status === 'fulfilled' ? s1.value.data.rank : '-',
                sem2: s2.status === 'fulfilled' ? s2.value.data.rank : '-',
                overall: overall.status === 'fulfilled' ? overall.value.data.rank : '-'
            };
        } catch (error) {
            console.error("Rank Service Error:", error);
            return { sem1: '-', sem2: '-', overall: '-' };
        }
    }
};

export default rankService;