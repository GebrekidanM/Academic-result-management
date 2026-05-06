// src/services/rosterService.js
import api from './api';

const getSubjectRoster = ({ classId, streamId, subjectId, semester, academicYear }) => {
    return api.get('/rosters/subject-details', {
        params: { classId, streamId, subjectId, semester, academicYear }
    });
};

const getRoster = ({ classId, streamId, academicYear }) => {
    return api.get('/rosters', {
        params: { classId, streamId, academicYear }
    });
};


export default {
    getRoster,
    getSubjectRoster
};