// src/services/offlineAssessmentService.js

const KEY = 'offline_assessments';

const getLocalAssessments = () => {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
};

const addLocalAssessment = (assessmentData) => {
    const list = getLocalAssessments();
    
    // Generate a temporary ID (Prefix with TEMP_ so we know it's not from MongoDB)
    const tempId = `TEMP_${Date.now()}`;
    
    const newAssessment = {
        ...assessmentData,
        _id: tempId, // Fake ID
        isOffline: true, // Flag to identify it later
        createdAt: new Date().toISOString()
    };

    list.push(newAssessment);
    localStorage.setItem(KEY, JSON.stringify(list));
    return newAssessment;
};

const removeLocalAssessment = (tempId) => {
    let list = getLocalAssessments();
    list = list.filter(a => a._id !== tempId);
    localStorage.setItem(KEY, JSON.stringify(list));
};

const clearAll = () => localStorage.removeItem(KEY);

export default {
    getLocalAssessments,
    addLocalAssessment,
    removeLocalAssessment,
    clearAll
};