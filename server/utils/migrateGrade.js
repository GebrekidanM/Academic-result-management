// server/migrateGrades.js
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');

// Our optimized grade formatting formula
function formatGrade(input) {
  if (!input) return input;

  let formatted = input.trim().toLowerCase();
  formatted = formatted.replace(/\b([a-z])/g, (match) => match.toUpperCase());
  formatted = formatted.replace(/(\d)\s*([a-z])/gi, (match, num, letter) => {
    return num + letter.toUpperCase();
  });
  return formatted;
}

const runMigration = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error("MONGO_URI not found in your .env file.");
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoURI);
        console.log("Connected successfully.");

        // Fetch all students (both active and inactive)
        const students = await Student.find({});
        console.log(`Found ${students.length} total students to inspect...\n`);

        let updatedCount = 0;

        for (const student of students) {
            let needsSave = false;

            // 1. Format the active gradeLevel
            if (student.gradeLevel) {
                const formattedActiveGrade = formatGrade(student.gradeLevel);
                if (student.gradeLevel !== formattedActiveGrade) {
                    console.log(`[Grade Level] Updating ${student.fullName}: "${student.gradeLevel}" ➔ "${formattedActiveGrade}"`);
                    student.gradeLevel = formattedActiveGrade;
                    needsSave = true;
                }
            }

            // 2. Format historical gradeLevels in their academicHistory array
            if (Array.isArray(student.academicHistory) && student.academicHistory.length > 0) {
                student.academicHistory.forEach((history) => {
                    if (history.gradeAtThatTime) {
                        const formattedHistGrade = formatGrade(history.gradeAtThatTime);
                        if (history.gradeAtThatTime !== formattedHistGrade) {
                            console.log(`  └─ [History] Updating ${student.fullName}: "${history.gradeAtThatTime}" ➔ "${formattedHistGrade}"`);
                            history.gradeAtThatTime = formattedHistGrade;
                            needsSave = true;
                        }
                    }
                });
            }

            if (needsSave) {
                // validateBeforeSave: false is used here to bypass password 
                // and schema validators during structural data migrations.
                await student.save({ validateBeforeSave: false });
                updatedCount++;
            }
        }

        console.log(`\nMigration completed successfully!`);
        console.log(`Total students updated: ${updatedCount}`);
        process.exit(0);

    } catch (error) {
        console.error("\nMigration failed:", error.message);
        process.exit(1);
    }
};

runMigration();