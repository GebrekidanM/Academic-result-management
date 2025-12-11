import api from './api';

const getAnalysis = (selectedAssessment,selectedGrade) => {
    return api.get('/analytics/assessment', {
        params: { selectedAssessment ,selectedGrade }
    });
};
const getSubjectPerformance = (filters) =>{
    return api.get(`analytics/aGradeAnalysis`,{
        params: filters 
    })
}


const getClassAnalytics = (filters)=>{
    return api.get(`analytics/class-analytics`,{
        params:{
            gradeLevel: filters.gradeLevel,
            assessmentName: filters.assessmentName,
            semester: filters.semester,
            academicYear: filters.academicYear
        }
    })

}

const getAtRiskStudents = (filters) => {
    return api.get('/analytics/at-risk', { params: filters });
};

export default {
    getAnalysis,
    getSubjectPerformance,
    getClassAnalytics,
    getAtRiskStudents
};