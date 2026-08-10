// server/utils/repairGradeReferences.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function repairGradeReferences() {
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
        const studentsColl = db.collection('students');
        const subjectsColl = db.collection('subjects');

        // 1. Build lookup maps for active Students and Subjects
        const allStudents = await studentsColl.find({}).toArray();
        const studentByCustomIdMap = new Map();
        const studentByIdMap = new Map();
        
        allStudents.forEach(s => {
            if (s.studentId) studentByCustomIdMap.set(s.studentId.trim(), s._id);
            studentByIdMap.set(s._id.toString(), s);
        });

        const allSubjects = await subjectsColl.find({}).toArray();
        const subjectByNameMap = new Map();
        const subjectByIdMap = new Map();

        allSubjects.forEach(sub => {
            subjectByNameMap.set(sub.name.toLowerCase().trim(), sub._id);
            subjectByIdMap.set(sub._id.toString(), sub);
        });

        console.log(`Loaded ${allStudents.length} active students and ${allSubjects.length} active subjects.`);

        // 2. Scan all Grade documents
        const grades = await gradesColl.find({}).toArray();
        console.log(`Scanning ${grades.length} grade documents...\n`);

        let repairedCount = 0;

        for (const grade of grades) {
            let needsUpdate = false;
            let newStudentId = grade.student;
            let newSubjectId = grade.subject;

            // --- A. Fix Student Link ---
            const oldStudentDoc = studentByIdMap.get(grade.student.toString());
            if (oldStudentDoc && oldStudentDoc.studentId) {
                // Get the active student document matching studentId (e.g., FKS-2018-004)
                const activeStudentObjectId = studentByCustomIdMap.get(oldStudentDoc.studentId.trim());
                if (activeStudentObjectId && !activeStudentObjectId.equals(grade.student)) {
                    newStudentId = activeStudentObjectId;
                    needsUpdate = true;
                }
            }

            // --- B. Fix Subject Link ---
            const oldSubjectDoc = subjectByIdMap.get(grade.subject.toString());
            if (oldSubjectDoc && oldSubjectDoc.name) {
                const activeSubjectObjectId = subjectByNameMap.get(oldSubjectDoc.name.toLowerCase().trim());
                if (activeSubjectObjectId && !activeSubjectObjectId.equals(grade.subject)) {
                    newSubjectId = activeSubjectObjectId;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                await gradesColl.updateOne(
                    { _id: grade._id },
                    {
                        $set: {
                            student: newStudentId,
                            subject: newSubjectId
                        }
                    }
                );
                repairedCount++;
                console.log(`✅ Re-linked Grade ${grade._id} to active Student (${newStudentId}) and Subject (${newSubjectId})`);
            }
        }

        console.log("\n=================================");
        console.log("🎉 Reference Repair Summary:");
        console.log(`   Total Grades Checked : ${grades.length}`);
        console.log(`   Re-linked / Repaired : ${repairedCount}`);
        console.log("=================================\n");

    } catch (err) {
        console.error("❌ Repair error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

repairGradeReferences();