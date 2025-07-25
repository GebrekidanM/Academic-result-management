// backend/routes/studentRoutes.js
const express = require('express');
const multer = require('multer'); 
const router = express.Router();
const { 
    createStudent, 
    getStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    bulkCreateStudents 
} = require('../controllers/studentController');

const upload = multer({ dest: 'uploads/' });

// Import your definitive middleware
const { protect, authorize, canViewStudentData  } = require('../middleware/authMiddleware');

// --- SECURE ROUTE DEFINITIONS ---

router.post('/upload', protect, authorize('admin'), upload.single('studentsFile'), bulkCreateStudents);
// Routes for creating a student and getting the full list
router.route('/')
    // Rule: Any logged-in user (teacher or admin) can get the list of students.
    .get(protect, getStudents)
    // Rule: ONLY an admin can create a new student.
    .post(protect, authorize('admin'), createStudent);

// Routes for interacting with a single student by their ID
router.route('/:id').get(canViewStudentData, getStudentById)
    .put(protect, authorize('admin'), updateStudent)
    .delete(protect, authorize('admin'), deleteStudent);

module.exports = router;