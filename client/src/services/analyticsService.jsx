import api from './api';

const getAnalysis = (selectedAssessment,selectedGrade) => {
    return api.get('/analytics/assessment', {
        params: { selectedAssessment ,selectedGrade }
    });
};
const aGradeAnalysis = (assessment) =>{
    return api.get(`analytics/aGradeAnalysis/${assessment}`)
}


export default {
    getAnalysis,
    aGradeAnalysis
};