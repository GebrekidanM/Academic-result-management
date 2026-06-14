// src/services/rosterService.js
import api from './api';

const getSubjectRoster = ({ gradeLevel, subjectId, semester, academicYear }) => {
    return api.get('/rosters/subject-details', {
        params: { gradeLevel, subjectId, semester, academicYear }
    });
};

const getRoster = ({ gradeLevel, academicYear }) => {
    return api.get('/rosters', {
        params: { gradeLevel, academicYear }
    });
};


export default {
    getRoster,
    getSubjectRoster
};