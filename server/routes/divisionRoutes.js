const express = require('express');
const router = express.Router();
const {
    getAllDivisions,
    getDivisionById,
    createDivision,
    updateDivision,
    deleteDivision,
    setActiveDivision,
    getDivisionFromScore
} = require('../controllers/divisionController');

router.get('/', getAllDivisions);
router.get('/calculate', getDivisionFromScore);
router.get('/:id', getDivisionById);
router.post('/', createDivision);
router.put('/:id', updateDivision);
router.delete('/:id', deleteDivision);
router.put('/:id/activate', setActiveDivision);

module.exports = router;
