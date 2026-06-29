const mongoose = require('mongoose');
const AssessmentType = require('./models/AssessmentType');
const AssessmentName = require('./models/AssessmentName');
require('dotenv').config();

function standardizeName(rawName) {
    if (!rawName) return "Unknown";
    
    // ባዶ ቦታዎችን ማጽዳት እና ብዙ ስፔሶችን ወደ አንድ ስፔስ ማሳነስ
    let clean = rawName.trim().replace(/\s+/g, ' ');

    // 1. የ Quiz አጻጻፎችን ማስተካከል (Quiz 1, quiz 1, Quiz-1, Quiz1)
    const quizMatch = clean.match(/^quiz\s*[- ]?\s*(\d+)$/i);
    if (quizMatch) {
        return `Quiz ${quizMatch[1]}`; // ወደ "Quiz X" ይቀይረዋል
    }

    // 2. የ Test አጻጻፎችን ማስተካከል (Test 1, test 1, Test-1, Test1)
    const testMatch = clean.match(/^test\s*[- ]?\s*(\d+)$/i);
    if (testMatch) {
        return `Test ${testMatch[1]}`; // ወደ "Test X" ይቀይረዋል
    }

    // 3. የ Homework አጻጻፎችን ማስተካከል (Homework 1, Home work 1, homework-1)
    const hwMatch = clean.match(/^(home\s*work|homework)\s*[- ]?\s*(\d+)$/i);
    if (hwMatch) {
        return `Homework ${hwMatch[2]}`; // ወደ "Homework X" ይቀይረዋል
    }

    // 4. የ Assignment አጻጻፎችን ማስተካከል (Assignment 1, Assignment-1)
    const assignMatch = clean.match(/^assignment\s*[- ]?\s*(\d+)$/i);
    if (assignMatch) {
        return `Assignment ${assignMatch[1]}`; // ወደ "Assignment X" ይቀይረዋል
    }

    // 5. የ Mid Exam አጻጻፎችን ማስተካከል (mid term, Midterm, Mid-exam)
    if (/^(mid\s*exam|mid-exam|midterm|mid\s*term)$/i.test(clean)) {
        return "Mid Exam";
    }

    // 6. የ Final Exam አጻጻፎችን ማስተካከል (final exam, finalterm, final-exam)
    if (/^(final\s*exam|final-exam|finalterm|final\s*term)$/i.test(clean)) {
        return "Final Exam";
    }

    // 7. ሌላ የተለየ ስም ካለ እያንዳንዱን ቃል የመጀመሪያ ፊደል ካፒታል ማድረግ (ለምሳሌ: "project work" -> "Project Work")
    return clean.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

const migrateAssessmentNames = async () => {
    try {
        console.log("🔄 Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        // 1. ሁሉንም የቆዩ የፈተና አይነቶች መፈለግ
        const types = await AssessmentType.find({});
        console.log(`🔍 Found ${types.length} assessment types. Starting migration...`);

        let migratedCount = 0;

        for (const type of types) {
            // ስሙ ቀድሞውኑ ወደ ObjectId የተቀየረ ከሆነ ማለፍ
            if (mongoose.Types.ObjectId.isValid(type.name)) {
                continue;
            }

            const rawStringName = type.name; // ለምሳሌ "quiz-1" ወይም "Quiz 1"
            
            // ⚠️ 2. ስሙን በረዳት ፈንክሽኑ ማጽዳት (ለምሳሌ "quiz-1" እና "Quiz 1" ሁለቱም "Quiz 1" ይሆናሉ)
            const cleanStringName = standardizeName(rawStringName); 

            // 3. የጸዳው ስም በAssessmentName ውስጥ ካለ መፈለግ፣ ከሌለ መፍጠር
            let nameDoc = await AssessmentName.findOne({ name: cleanStringName });
            if (!nameDoc) {
                nameDoc = await AssessmentName.create({ name: cleanStringName });
                console.log(`🆕 Created standard AssessmentName: "${cleanStringName}" (from: "${rawStringName}")`);
            }

            // 4. የድሮውን የጽሁፍ ስም በአዲሱ የObjectId መታወቂያ መተካት
            await AssessmentType.updateOne(
                { _id: type._id },
                { $set: { name: nameDoc._id } }
            );
            migratedCount++;
        }

        console.log(`\n🎉 Migration & Cleaning Complete! Successfully migrated ${migratedCount} assessment types to use unified ObjectId references.`);

    } catch (error) {
        console.error("❌ Migration failed:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Connection closed.");
    }
};

migrateAssessmentNames();