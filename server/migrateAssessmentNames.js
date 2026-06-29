const mongoose = require('mongoose');
const AssessmentType = require('./models/AssessmentType'); // የፋይሉን መንገድ አስተካክል
const AssessmentName = require('./models/AssessmentName'); // የፋይሉን መንገድ አስተካክል
require('dotenv').config();

// ⚠️ የተሻሻለው የዳታ ማጽጃ እና ማዋሃጃ ረዳት ፈንክሽን
function standardizeName(rawName) {
    if (!rawName) return "Unknown";
    
    // ባዶ ቦታዎችን ማጽዳት እና ብዙ ስፔሶችን ወደ አንድ ስፔስ ማሳነስ
    let clean = rawName.trim().replace(/\s+/g, ' ');

    // 1. የ Quiz አጻጻፎችን ማስተካከል (Quiz 1, Quiz-1)
    const quizMatch = clean.match(/^quiz\s*[- ]?\s*(\d+)$/i);
    if (quizMatch) return `Quiz ${quizMatch[1]}`;

    // 2. የ Test አጻጻፎችን ማስተካከል (Test 1, Test-1)
    const testMatch = clean.match(/^test\s*[- ]?\s*(\d+)$/i);
    if (testMatch) return `Test ${testMatch[1]}`;

    // 3. የ Homework አጻጻፎችን ማስተካከል (Homework 1, homework-1, H.w)
    const hwMatch = clean.match(/^(home\s*work|homework)\s*[- ]?\s*(\d+)$/i);
    if (hwMatch) return `Homework ${hwMatch[2]}`;
    if (/^(h\.w|hw)$/i.test(clean)) return "H.W";

    const hwNumMatch = clean.match(/^(h\.w|hw)\s*[- ]?\s*(\d+)$/i);
    if (hwNumMatch) return `H.W ${hwNumMatch[2]}`;

    // 4. የ Assignment አጻጻፎችን ማስተካከል
    const assignMatch = clean.match(/^assignment\s*[- ]?\s*(\d+)$/i);
    if (assignMatch) return `Assignment ${assignMatch[1]}`;

    // 5. የ Mid Exam አጻጻፎችን ማስተካከል
    if (/^(mid\s*exam|mid-exam|midterm|mid\s*term)$/i.test(clean)) return "Mid Exam";

    // 6. የ Final Exam አጻጻፎችን ማስተካከል
    if (/^(final\s*exam|final-exam|finalterm|final\s*term)$/i.test(clean)) return "Final Exam";

    // ⚠️ 7. የአማርኛ የማጠቃለያ ፈተና አጻጻፎችን በሙሉ ወደ አንድ መደበኛ ስም ማዋሃድ
    if (/^(የ)?(ማ|መ)ጠቃል(ያ|የ)(\s*ፈተና|\s*ኤግዛም)?$/i.test(clean) || /^(የ)?ማጠቃለያ$/i.test(clean)) {
        return "የማጠቃለያ ፈተና";
    }

    // ⚠️ 8. የኦሮሚኛ አጻጻፎችን ማስተካከል (Walii gala -> Waliigala)
    if (/^(walii\s*gala|waliigala)$/i.test(clean)) {
        return "Waliigala";
    }

    // 9. ሌላ የተለየ ስም ካለ እያንዳንዱን ቃል የመጀመሪያ ፊደል ካፒታል ማድረግ
    return clean.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

const migrateAssessmentNames = async () => {
    try {
        console.log("🔄 Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        const db = mongoose.connection.db;
        const collection = db.collection('assessmenttypes');

        // ⚠️ 1. በጅምላ ሁሉንም የቆዩ የ AssessmentType Unique ኢንዴክሶችን ማጥፋት [2]
        const indexes = await collection.listIndexes().toArray();
        console.log(`🔍 Found ${indexes.length} indexes on assessmenttypes. Cleaning up legacy unique indexes...`);

        for (const idx of indexes) {
            if (idx.name === '_id_') continue;

            if (idx.unique) {
                // አዲሱ (6 ፊልድ የያዘው) ኢንዴክስ መሆኑን ማረጋገጥ
                const isNewIndex = idx.key && 
                                   idx.key.name === 1 && 
                                   idx.key.subject === 1 && 
                                   idx.key.gradeLevel === 1 && 
                                   idx.key.semester === 1 && 
                                   idx.key.month === 1 && 
                                   idx.key.year === 1;

                if (!isNewIndex) {
                    console.log(`🧹 Dropping legacy unique index: ${idx.name}...`);
                    await collection.dropIndex(idx.name);
                    console.log(`✅ Successfully dropped: ${idx.name}`);
                }
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

        console.log(`\n🎉 Migration & Index Cleanup Complete!`);
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