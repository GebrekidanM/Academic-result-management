const express = require('express');
const router = express.Router();
const { getSemesters, createSemester, updateSemester, deleteSemester } = require('../controllers/semesterController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getSemesters);
router.post('/', createSemester);
router.put('/:id', updateSemester);
router.delete('/:id', deleteSemester);

module.exports = router;
