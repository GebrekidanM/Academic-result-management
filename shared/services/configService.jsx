import subjectService from './subjectService';
import userService from './userService';

const getGradesForUser = async (currentUser) => {
    try {
        let uniqueGrades = [];

        // CASE 1: ADMIN, STAFF, PRINCIPAL
        if (['admin', 'staff', 'principal'].includes(currentUser.role)) {
            const res = await subjectService.getAllSubjects();
            const allSubjects = res.data.data || res.data;
            let allGrades = [...new Set(allSubjects.map(s => s.gradeLevel))];

            // Filter by School Level
            if (currentUser.role === 'staff' && currentUser.schoolLevel) {
                const level = currentUser.schoolLevel.toLowerCase();
                if (level === 'kg') {
                    allGrades = allGrades.filter(g => /^(kg|nursery)/i.test(g));
                } else if (level === 'primary') {
                    allGrades = allGrades.filter(g => /^Grade\s*[1-8](\D|$)/i.test(g));
                } else if (level === 'high school') {
                    allGrades = allGrades.filter(g => /^Grade\s*(9|1[0-2])(\D|$)/i.test(g));
                }
            }
            uniqueGrades = allGrades.sort();
        } 
        // CASE 2: TEACHER
        else {
            const res = await userService.getProfile();
            if (res.data && res.data.subjectsTaught) {
                uniqueGrades = [...new Set(res.data.subjectsTaught.map(a => a.subject?.gradeLevel).filter(Boolean))].sort();
            }
        }
        return uniqueGrades;
    } catch (err) {
        console.error("Error in configService:", err);
        return [];
    }
};

const configService = {
    getGradesForUser
};

export default configService;