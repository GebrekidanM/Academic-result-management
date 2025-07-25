import api from './api';

const getRank = ({ studentId, academicYear, semester, gradeLevel }) => {
    return api.get(`/ranks/class-rank/${studentId}?academicYear=${academicYear}&semester=${semester}&gradeLevel=${gradeLevel}`);
};

const getOverallRank = ({ studentId, academicYear, gradeLevel }) => {
    return api.get(`/ranks/overall-rank/${studentId}`, {
        params: {
            academicYear,
            gradeLevel
        }
    });
};

export default {
    getRank,
    getOverallRank
};