// utils/inspectGrades.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function inspectGradesCollection() {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    const gradesColl = db.collection('grades');

    const totalCount = await gradesColl.countDocuments();
    const distinctYears = await gradesColl.distinct('academicYear');
    const samples = await gradesColl.find({}).limit(3).toArray();

    console.log("\n================ 🔍 DATABASE GRADE INSPECTION ================");
    console.log(`Total Grade Documents in DB : ${totalCount}`);
    console.log(`Distinct Academic Years in DB:`, distinctYears);
    console.log("\nSample Grade Documents:");
    console.log(JSON.stringify(samples, null, 2));
    console.log("=============================================================\n");

    await mongoose.disconnect();
    process.exit(0);
}

inspectGradesCollection();