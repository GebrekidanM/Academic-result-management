const express = require('express');
const router = express.Router();

const {getSemesterRank, getOverallRank , getClassRanksBatchAll} = require('../controllers/rankController');

router.get('/class-rank/:studentId', getSemesterRank);
router.get('/overall-rank/:studentId', getOverallRank);
router.get('/class-batch-all',getClassRanksBatchAll)
module.exports = router;