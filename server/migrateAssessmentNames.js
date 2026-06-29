const mongoose = require('mongoose');
const AssessmentType = require('./models/AssessmentType'); // የፋይሉን መንገድ አስተካክል
const AssessmentName = require('./models/AssessmentName'); // የፋይሉን መንገድ አስተካክል
require('dotenv').config();

// የዳታ ማጽጃ እና ማዋሃጃ ረዳት ፈንክሽን
function standardizeName(rawName) {
    if (!rawName) return "Unknown";
    let clean = rawName.trim().replace(/\s+/g, ' ');

    const quizMatch = clean.match(/^quiz\s*[- ]?\s*(\d+)$/i);
    if (quizMatch) return `Quiz ${quizMatch[1]}`;

    const testMatch = clean.match(/^test\s*[- ]?\s*(\d+)$/i);
    if (testMatch) return `Test ${testMatch[1]}`;

    const hwMatch = clean.match(/^(home\s*work|homework)\s*[- ]?\s*(\d+)$/i);
    if (hwMatch) return `Homework ${hwMatch[2]}`;
    if (/^(h\.w|hw)$/i.test(clean)) return "H.W";

    const hwNumMatch = clean.match(/^(h\.w|hw)\s*[- ]?\s*(\d+)$/i);
    if (hwNumMatch) return `H.W ${hwNumMatch[2]}`;

    const assignMatch = clean.match(/^assignment\s*[- ]?\s*(\d+)$/i);
    if (assignMatch) return `Assignment ${assignMatch[1]}`;

    if (/^(mid\s*exam|mid-exam|midterm|mid\s*term)$/i.test(clean)) return "Mid Exam";
    if (/^(final\s*exam|final-exam|finalterm|final\s*term)$/i.test(clean)) return "Final Exam";

    if (/^(የ)?(ማ|መ)ጠቃል(ያ|የ)(\s*ፈተና|\s*ኤግዛም)?$/i.test(clean) || /^(የ)?ማጠቃለያ$/i.test(clean)) {
        return "የማጠቃለያ ፈተና";
    }

    if (/^(walii\s*gala|waliigala)$/i.test(clean)) {
        return "Waliigala";
    }

    return clean.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

const migrateAssessmentNames = async () => {
    try {
        console.log("🔄 Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        // ⚠️ 1. አሮጌዎቹን ሁለቱንም እልከኛ Unique ኢንዴክሶች በቀጥታ በሞዴሉ በኩል ማጥፋት (Drop Index) [2]
        const legacyIndexes = [
            'name_1_subject_1_gradeLevel_1_semester_1',
            'name_1_subject_1_gradeLevel_1_semester_1_month_1'
        ];

        for (const indexName of legacyIndexes) {
            try {
                console.log(`🧹 Dropping legacy index: ${indexName}...`);
                // AssessmentType.collection የ Mongoose ሞዴሉን በቀጥታ ስለሚያነሳ ከስህተት የጸዳ ነው [2]
                await AssessmentType.collection.dropIndex(indexName);
                console.log(`✅ Successfully dropped legacy index: ${indexName}`);
            } catch (e) {
                console.log(`ℹ️ Index ${indexName} did not exist or was already dropped.`);
            }
        }

        const types = await AssessmentType.find({});
        console.log(`🔍 Found ${types.length} assessment types. Starting migration...`);

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const type of types) {
            // ስሙ ባዶ ወይም "undefined" ከሆነ ሰነዱን ማለፍ
            if (!type.name || type.name === "undefined") {
                console.log(`⚠️ Warning: AssessmentType ${type._id} has no valid name. Skipping.`);
                skippedCount++;
                continue;
            }

            if (mongoose.Types.ObjectId.isValid(type.name)) {
                continue;
            }

            const rawStringName = type.name;
            const cleanStringName = standardizeName(rawStringName); 

            let nameDoc = await AssessmentName.findOne({ name: cleanStringName });
            if (!nameDoc) {
                nameDoc = await AssessmentName.create({ name: cleanStringName });
                console.log(`🆕 Created standard AssessmentName: "${cleanStringName}" (from: "${rawStringName}")`);
            }

            try {
                // update ስታደርግ ስህተት ካጋጠመ ሙሉውን ስክሪፕት እንዳይሰብረው በ try/catch መያዝ
                await AssessmentType.updateOne(
                    { _id: type._id },
                    { $set: { name: nameDoc._id } }
                );
                migratedCount++;
            } catch (updateErr) {
                if (updateErr.code === 11000) {
                    console.error(`⚠️ Duplicate detected! Skipping specific update for ${type._id} ("${cleanStringName}") to avoid crash.`);
                    errorCount++;
                } else {
                    throw updateErr;
                }
            }
        }

        console.log(`\n🎉 Migration Complete!`);
        console.log(`Successfully migrated: ${migratedCount}`);
        console.log(`Skipped (corrupted name): ${skippedCount}`);
        console.log(`Skipped (duplicate collisions): ${errorCount}`);

    } catch (error) {
        console.error("❌ Migration failed completely:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Connection closed.");
    }
};

migrateAssessmentNames();