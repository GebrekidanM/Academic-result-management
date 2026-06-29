const mongoose = require('mongoose');
const AssessmentType = require('./models/AssessmentType'); // ⚠️ የሞዴል መንገድን አስተካክል
require('dotenv').config();

const convertYearsToString = async () => {
    try {
        console.log("🔄 Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        // 1. በቁጥር (Number/Int32) የተቀመጡትን የቆዩ AssessmentTypes ብቻ መፈለግ
        const affectedDocs = await AssessmentType.find({ year: { $type: "number" } });
        console.log(`🔍 Found ${affectedDocs.length} assessment types with numeric year. Converting...`);

        let updatedCount = 0;
        for (const doc of affectedDocs) {
            const numericYear = doc.year;
            
            // ⚠️ እያንዳንዱን የቆየ ቁጥር ወደ String መለወጥ
            await AssessmentType.updateOne(
                { _id: doc._id },
                { $set: { year: String(numericYear) } }
            );
            updatedCount++;
        }

        console.log(`\n🎉 Conversion complete! Converted ${updatedCount} assessment types to String.`);

    } catch (error) {
        console.error("❌ Conversion failed:", error.message);
    }
};
