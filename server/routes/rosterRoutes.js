// backend/routes/rosterRoutes.js
const express = require('express');
const router = express.Router();

// --- Make sure all these are imported correctly from your controllers and middleware ---
const { 
    generateRoster, 
    generateSubjectRoster 
} = require('../controllers/rosterController');

const { 
    protect, 
    isHomeroomTeacherOrAdmin, 
    isTeacherForSubject 
} = require('../middleware/authMiddleware');


// --- ROUTE DEFINITIONS ---

// This handles the Yearly Roster request: GET /api/rosters
router.get('/', protect, isHomeroomTeacherOrAdmin, generateRoster);


// === THIS IS THE CRITICAL ROUTE THAT IS CAUSING THE 404 ERROR ===
// It MUST be defined to handle GET requests to /api/rosters/subject-details
router.get('/subject-details', protect, isTeacherForSubject, generateSubjectRoster);
// ================================================================


module.exports = router;