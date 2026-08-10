// utils/assignSubjectsToGrades.js
path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Subject = require('../models/Subject');
const GradeLevel = require('../models/GradeLevel');

async function linkSubjectsToGradeLevels() {
    await mongoose.connect(process.env.MONGO_URI || process.env.DATABASE_URL);
    console.log("Connected to MongoDB...");

    const gradeLevels = await GradeLevel.find({});
    const subjects = await Subject.find({});

    console.log(`Found ${subjects.length} subjects and ${gradeLevels.length} grade levels.`);

    const gradeLevelEntries = gradeLevels.map(gl => ({
        gradeLevel: gl._id,
        sessionsPerWeek: 3
    }));

    for (const subject of subjects) {
        if (!subject.gradeLevels || subject.gradeLevels.length === 0) {
            subject.gradeLevels = gradeLevelEntries;
            await subject.save();
            console.log(`✅ Assigned all ${gradeLevels.length} grade levels to subject: "${subject.name}"`);
        }
    }

    console.log("\n🎉 Subject grade level linking complete!");
    await mongoose.disconnect();
    process.exit(0);
}

linkSubjectsToGradeLevels();