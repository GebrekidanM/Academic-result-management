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

export default {
    getAnalysis,
    aGradeAnalysis
};