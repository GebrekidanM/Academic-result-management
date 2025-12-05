import api from './api';

const getAnalysis = (selectedAssessment,selectedGrade) => {
    return api.get('/analytics/assessment', {
        params: { selectedAssessment ,selectedGrade }
    });
};
const aGradeAnalysis = ({assessment,academicYear}) =>{
    return api.get(`analytics/aGradeAnalysis/${assessment}`,{
        params:{academicYear}
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


export default {
    getAnalysis,
    aGradeAnalysis,
    getClassAnalytics
};