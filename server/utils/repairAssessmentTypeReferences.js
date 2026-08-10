// server/utils/repairAssessmentTypeReferences.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function repairAssessmentTypeReferences() {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
    await mongoose.connect(mongoUri);

    const db = mongoose.connection.db;
    const assessmentTypesColl = db.collection('assessmenttypes');
    const subjectsColl = db.collection('subjects');

    const allSubjects = await subjectsColl.find({}).toArray();
    const subjectByNameMap = new Map();
    const subjectByIdMap = new Map();

    allSubjects.forEach(sub => {
        subjectByNameMap.set(sub.name.toLowerCase().trim(), sub._id);
        subjectByIdMap.set(sub._id.toString(), sub);
    });

    const docs = await assessmentTypesColl.find({}).toArray();
    console.log(`Scanning ${docs.length} AssessmentType documents...`);

    let repairedCount = 0;

    for (const doc of docs) {
        let newSubjectId = doc.subject;
        let needsUpdate = false;

        const oldSubjectDoc = subjectByIdMap.get(doc.subject ? doc.subject.toString() : '');
        if (oldSubjectDoc && oldSubjectDoc.name) {
            const activeSubjectId = subjectByNameMap.get(oldSubjectDoc.name.toLowerCase().trim());
            if (activeSubjectId && !activeSubjectId.equals(doc.subject)) {
                newSubjectId = activeSubjectId;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            await assessmentTypesColl.updateOne(
                { _id: doc._id },
                { $set: { subject: newSubjectId } }
            );
            repairedCount++;
            console.log(`✅ Re-linked AssessmentType ${doc._id} to active Subject (${newSubjectId})`);
        }
    }

    console.log(`\n🎉 Done! Repaired ${repairedCount} AssessmentType documents.`);
    await mongoose.disconnect();
    process.exit(0);
}

repairAssessmentTypeReferences();