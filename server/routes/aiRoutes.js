const express = require("express");
const {generateSemesterInsight,getSavedSemesterInsight, askSemesterQuestion} = require("../controllers/aiController");
const router = express.Router();

router.post("/semester-insight", generateSemesterInsight);
router.get("/semester-insight", getSavedSemesterInsight);
router.post('/ask-question',askSemesterQuestion);
module.exports = router;