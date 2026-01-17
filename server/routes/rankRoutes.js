const express = require('express');
const router = express.Router();

const { 
    getSemesterRank, 
    getOverallRank 
} = require('../controllers/rankController');

router.get('/class-rank/:studentId', getSemesterRank);

router.get('/overall-rank/:studentId', getOverallRank);

module.exports = router;