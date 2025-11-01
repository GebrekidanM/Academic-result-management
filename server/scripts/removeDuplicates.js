// removeDuplicates.js
require('dotenv').config();
const mongoose = require('mongoose');
const Grade = require('../models/Grade');

async function cleanDuplicateAssessments() {
  await mongoose.connect(process.env.MONGO_URI);

  const grades = await Grade.find({});

  for (const grade of grades) {
    const seen = new Map();
    const cleaned = [];

    // Iterate through assessments in order
    for (const assessment of grade.assessments) {
      const typeId = assessment.assessmentType.toString();

      if (!seen.has(typeId)) {
        seen.set(typeId, assessment);
      } else {
        // Optional: keep the latest (overwrite previous)
        seen.set(typeId, assessment);

        // OR if you prefer highest:
        // if ((assessment.score || 0) > (seen.get(typeId).score || 0)) {
        //   seen.set(typeId, assessment);
        // }
      }
    }

    grade.assessments = Array.from(seen.values());

    // Recalculate finalScore
    grade.finalScore = grade.assessments.reduce((sum, a) => sum + (a.score || 0), 0);

    await grade.save();
  }

  console.log("✅ Duplicate assessments cleaned successfully!");
  await mongoose.disconnect();
}

cleanDuplicateAssessments().catch(err => console.error(err));
