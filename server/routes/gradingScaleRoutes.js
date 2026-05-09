const express = require('express');
const router = express.Router();
const {
    getAllGradingScales,
    getGradingScaleById,
    createGradingScale,
    updateGradingScale,
    deleteGradingScale,
    setActiveGradingScale,
    getGrade
} = require('../controllers/gradingScaleController');

router.get('/', getAllGradingScales);
router.get('/calculate', getGrade);
router.get('/:id', getGradingScaleById);
router.post('/', createGradingScale);
router.put('/:id', updateGradingScale);
router.delete('/:id', deleteGradingScale);
router.put('/:id/activate', setActiveGradingScale);

module.exports = router;
