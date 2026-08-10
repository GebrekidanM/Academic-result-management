// utils/migrateStudentGradeLevels.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function forceConvertGradeLevelsToObjectId() {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
    
    if (!mongoUri) {
        console.error("❌ MONGO_URI missing from .env");
        process.exit(1);
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        
        // Access native MongoDB driver (bypasses Mongoose schema casting)
        const db = mongoose.connection.db;
        const studentsCollection = db.collection('students');
        const gradeLevelsCollection = db.collection('gradelevels');

        // 1. Fetch GradeLevels to map names -> BSON ObjectIds
        const gradeLevels = await gradeLevelsCollection.find({}).toArray();
        const nameToIdMap = new Map();
        gradeLevels.forEach(gl => {
            nameToIdMap.set(gl.name.toLowerCase().trim(), gl._id); // gl._id is a native BSON ObjectId
        });

        console.log(`Loaded ${gradeLevels.length} GradeLevels from database.`);

        // 2. Fetch raw student documents directly from MongoDB
        const students = await studentsCollection.find({}).toArray();
        console.log(`Scanning ${students.length} raw student documents...`);

        let convertedCount = 0;
        let alreadyObjectIdCount = 0;

        for (const student of students) {
            let targetObjectId = null;

            // Check raw BSON type in MongoDB
            if (typeof student.gradeLevel === 'string') {
                const rawVal = student.gradeLevel.trim();

                // Case 1: The string is a 24-character hex ID ("6a64547f29b81bf921535d7e")
                if (mongoose.Types.ObjectId.isValid(rawVal) && rawVal.length === 24) {
                    targetObjectId = new mongoose.Types.ObjectId(rawVal);
                } 
                // Case 2: The string is a class name ("Kg 1B")
                else {
                    const matchedId = nameToIdMap.get(rawVal.toLowerCase());
                    if (matchedId) {
                        targetObjectId = matchedId;
                    } else {
                        console.warn(`⚠️ Could not find GradeLevel for string "${rawVal}" on student: ${student.fullName}`);
                    }
                }
            } else if (student.gradeLevel && student.gradeLevel._bsontype === 'ObjectID') {
                alreadyObjectIdCount++;
            }

            // Update directly in MongoDB using native $set
            if (targetObjectId) {
                await studentsCollection.updateOne(
                    { _id: student._id },
                    { $set: { gradeLevel: targetObjectId } }
                );
                convertedCount++;
                console.log(`✅ Converted ${student.fullName}: "${student.gradeLevel}" ➔ ObjectId("${targetObjectId}")`);
            }
        }

        console.log("\n=================================");
        console.log("🎉 Direct Migration Complete!");
        console.log(`   Converted Strings to ObjectIDs : ${convertedCount}`);
        console.log(`   Already Native ObjectIDs      : ${alreadyObjectIdCount}`);
        console.log("=================================\n");

    } catch (error) {
        console.error("❌ Migration error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

forceConvertGradeLevelsToObjectId();