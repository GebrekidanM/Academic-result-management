const express = require("express");
const {generateSemesterInsight,getSavedSemesterInsight} = require("../controllers/aiController");
const router = express.Router();

router.post("/semester-insight", generateSemesterInsight);
 router.get("/semester-insight", getSavedSemesterInsight);
module.exports = router;