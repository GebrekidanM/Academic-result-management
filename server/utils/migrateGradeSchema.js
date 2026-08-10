// server/utils/migrateGradeSchema.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function checkAndMigrateGrades() {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
    if (!mongoUri) {
        console.error("❌ MONGO_URI missing from .env");
        process.exit(1);
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri);

        const db = mongoose.connection.db;
        const gradesColl = db.collection('grades');

        const rawGrades = await gradesColl.find({}).toArray();
        console.log(`Scanning ${rawGrades.length} grade documents...\n`);

        let updatedCount = 0;

        for (const grade of rawGrades) {
            let needsUpdate = false;
            let studentId = grade.student;
            let subjectId = grade.subject;

            // 1. Convert student string -> BSON ObjectId
            if (typeof studentId === 'string' && mongoose.Types.ObjectId.isValid(studentId)) {
                studentId = new mongoose.Types.ObjectId(studentId);
                needsUpdate = true;
            }

            // 2. Convert subject string -> BSON ObjectId
            if (typeof subjectId === 'string' && mongoose.Types.ObjectId.isValid(subjectId)) {
                subjectId = new mongoose.Types.ObjectId(subjectId);
                needsUpdate = true;
            }

            // 3. Recalculate finalScore from assessments array
            const assessments = Array.isArray(grade.assessments) ? grade.assessments : [];
            const calculatedFinal = assessments.reduce((sum, a) => sum + (Number(a.score) || 0), 0);

            if (grade.finalScore !== calculatedFinal) {
                needsUpdate = true;
            }

            // 4. Convert nested assessmentType strings -> BSON ObjectIDs
            const fixedAssessments = assessments.map(a => {
                let aType = a.assessmentType;
                if (typeof aType === 'string' && mongoose.Types.ObjectId.isValid(aType)) {
                    aType = new mongoose.Types.ObjectId(aType);
                    needsUpdate = true;
                }
                return { ...a, assessmentType: aType };
            });

            if (needsUpdate) {
                await gradesColl.updateOne(
                    { _id: grade._id },
                    {
                        $set: {
                            student: studentId,
                            subject: subjectId,
                            assessments: fixedAssessments,
                            finalScore: calculatedFinal
                        }
                    }
                );
                updatedCount++;
                console.log(`✅ Converted Grade ${grade._id}: student & subject to ObjectIDs`);
            }
        }

        console.log("\n=================================");
        console.log("🎉 Grade Verification Summary:");
        console.log(`   Total Grades Checked : ${rawGrades.length}`);
        console.log(`   Updated / Fixed     : ${updatedCount}`);
        console.log("=================================\n");

    } catch (err) {
        console.error("❌ Error running grade migration:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkAndMigrateGrades();