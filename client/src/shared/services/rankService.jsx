import api from './api';
const API_URL = '/ranks';

const rankService = {
    // ⚠️ 1. ለአንድ ተማሪ ብቻ ራንክ የሚጠይቀው ነባሩ ኤፒአይ (የተማሪው ዝርዝር ገጽ እንዳይሰበር ይቀጥላል)
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
    },

    // ⚠️ 2. አዲሱ የክፍሉን ተማሪዎች ደረጃዎች በአንድ ጊዜ በጅምላ የሚጠይቀው ኤፒአይ (Batch API) [2]
    getClassRanksBatch: async (gradeLevel, academicYear) => {
        try {
            // በባክኤንድ አንድ ጥያቄ ብቻ በመላክ የሁሉንም ተማሪዎች ራንክ (Sem 1, Sem 2, Overall) በአንድ ጊዜ ያመጣል [2]
            const response = await api.get(`${API_URL}/class-batch-all`, {
                params: { gradeLevel, academicYear }
            });
            return response.data.ranks; // መዋቅሩ፦ { [studentId]: { sem1, sem2, overall } }
        } catch (error) {
            console.error("Error fetching class batch ranks:", error);
            return {};
        }
    }
};

export default rankService;