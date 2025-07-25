// src/services/behavioralReportService.js

// Import our custom axios instance that automatically adds the auth token
import api from './api';

// The base URL for the reports resource.
const API_URL = '/reports';

/**
 * Fetches all behavioral reports for a specific student.
 * Used in: StudentDetailPage
 * @param {string} studentId - The ID of the student.
 * @returns {Promise} Axios promise
 */
const getReportsByStudent = (studentId) => {
    return api.get(`${API_URL}/student/${studentId}`);
};

/**
 * Fetches a single behavioral report by its own ID.
 * Used in: EditReportPage (to load initial form data)
 * @param {string} reportId - The ID of the behavioral report.
 * @returns {Promise} Axios promise
 */
const getReportById = (reportId) => {
    return api.get(`${API_URL}/${reportId}`);
};

/**
 * Creates a new behavioral report.
 * Used in: AddReportPage
 * @param {object} reportData - The data for the new report.
 * @returns {Promise} Axios promise
 */
const addReport = (reportData) => {
    return api.post(API_URL, reportData);
};

/**
 * Updates an existing behavioral report.
 * Used in: EditReportPage
 * @param {string} reportId - The ID of the report to update.
 * @param {object} reportData - The new data for the report.
 * @returns {Promise} Axios promise
 */
const updateReport = (reportId, reportData) => {
    return api.put(`${API_URL}/${reportId}`, reportData);
};

/**
 * Deletes a behavioral report.
 * Used in: StudentDetailPage
 * @param {string} reportId - The ID of the report to delete.
 * @returns {Promise} Axios promise
 */
const deleteReport = (reportId) => {
    return api.delete(`${API_URL}/${reportId}`);
};


// Export all functions for use in our React components
export default {
    getReportsByStudent,
    getReportById,
    addReport,
    updateReport,
    deleteReport
};