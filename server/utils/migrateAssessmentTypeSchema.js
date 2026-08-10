// utils/migrateAssessmentTypeSchema.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function migrateAssessmentTypes() {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;

    if (!mongoUri) {
        console.error("❌ MONGO_URI missing from .env");
        process.exit(1);
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri);

        const db = mongoose.connection.db;
        const assessmentTypesColl = db.collection('assessmenttypes');
        const gradeLevelsColl = db.collection('gradelevels');

        // 1. Fetch GradeLevels and build map (name/id -> ObjectId)
        const gradeLevels = await gradeLevelsColl.find({}).toArray();
        const gradeMap = new Map();
        gradeLevels.forEach(gl => {
            gradeMap.set(gl.name.toLowerCase().trim(), gl._id);
            gradeMap.set(gl._id.toString(), gl._id);
        });

        console.log(`Loaded ${gradeLevels.length} GradeLevels from database.`);

        // 2. Fetch raw assessment types
        const rawAssessmentTypes = await assessmentTypesColl.find({}).toArray();
        console.log(`Scanning ${rawAssessmentTypes.length} raw assessment type documents...\n`);

        let updatedCount = 0;
        let warningCount = 0;

        for (const doc of rawAssessmentTypes) {
            let needsUpdate = false;
            let targetGradeLevelId = doc.gradeLevel;
            let targetNameId = doc.name;
            let targetSubjectId = doc.subject;

            // A. Fix gradeLevel (Convert "Kg 1B" -> GradeLevel BSON ObjectId)
            if (typeof doc.gradeLevel === 'string') {
                const searchKey = doc.gradeLevel.toLowerCase().trim();
                if (gradeMap.has(searchKey)) {
                    targetGradeLevelId = gradeMap.get(searchKey);
                    needsUpdate = true;
                } else if (mongoose.Types.ObjectId.isValid(doc.gradeLevel) && doc.gradeLevel.length === 24) {
                    targetGradeLevelId = new mongoose.Types.ObjectId(doc.gradeLevel);
                    needsUpdate = true;
                } else {
                    console.warn(`⚠️ Warning: Could not find GradeLevel for string "${doc.gradeLevel}" on AssessmentType ${doc._id}`);
                    warningCount++;
                }
            }

            // B. Fix `name` reference (Convert String 24-hex -> BSON ObjectId)
            if (typeof doc.name === 'string' && mongoose.Types.ObjectId.isValid(doc.name)) {
                targetNameId = new mongoose.Types.ObjectId(doc.name);
                needsUpdate = true;
            }

            // C. Fix `subject` reference (Convert String 24-hex -> BSON ObjectId)
            if (typeof doc.subject === 'string' && mongoose.Types.ObjectId.isValid(doc.subject)) {
                targetSubjectId = new mongoose.Types.ObjectId(doc.subject);
                needsUpdate = true;
            }

            if (needsUpdate && targetGradeLevelId) {
                await assessmentTypesColl.updateOne(
                    { _id: doc._id },
                    {
                        $set: {
                            gradeLevel: targetGradeLevelId,
                            name: targetNameId,
                            subject: targetSubjectId
                        }
                    }
                );
                updatedCount++;
                console.log(`✅ Converted AssessmentType ${doc._id}: gradeLevel set to ObjectId("${targetGradeLevelId}")`);
            }
        }

        console.log("\n=================================");
        console.log("🎉 AssessmentType Migration Summary:");
        console.log(`   Total Scanned : ${rawAssessmentTypes.length}`);
        console.log(`   Updated Docs  : ${updatedCount}`);
        console.log(`   Warnings      : ${warningCount}`);
        console.log("=================================\n");

    } catch (err) {
        console.error("❌ Migration error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrateAssessmentTypes();