const mongoose = require('mongoose');
const Grade = require('./models/Grade');
const AssessmentType = require('./models/AssessmentType');
require('dotenv').config();

const sanitizeDatabase = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        // 1. ሁሉንም የፈተና አይነቶች ከነ ሴሚስተራቸው እና አመታቸው መጫን
        const validTypes = await AssessmentType.find({});
        const typeMap = new Map(validTypes.map(t => [t._id.toString(), t]));
        console.log(`🔍 Found ${typeMap.size} valid Assessment Types in the database.`);

        const grades = await Grade.find({});
        console.log(`🔍 Scanning ${grades.length} student grade sheets...`);

        let fixedCount = 0;

        for (const grade of grades) {
            const originalLength = grade.assessments.length;
            
            // ⚠️ የጠለቀ ፍተሻ (Deep Check)፦ 
            // ፈተናው መኖሩን ብቻ ሳይሆን ሴሚስተሩ እና አመቱ ከ Grade ሰነዱ ጋር መጣጣሙን ያረጋግጣል
            let cleanAssessments = grade.assessments.filter(a => {
                if (!a.assessmentType) return false;
                
                const type = typeMap.get(a.assessmentType.toString());
                if (!type) return false; // የጠፋ ፈተና ከሆነ (Ghost)

                // ⚠️ የሰነዱ ሴሚስተር እና አመት ከፈተናው ሴሚስተር እና አመት ጋር እኩል መሆን አለበት
                return type.semester === grade.semester && type.year === grade.academicYear;
            });

            const removedCount = originalLength - cleanAssessments.length;
            if (removedCount > 0) {
                console.log(`🧹 Removed ${removedCount} mismatched/ghost assessments from Grade sheet ID: ${grade._id} (Student: ${grade.student})`);
            }

            // በአንድ ሰነድ ውስጥ ያሉ ተመሳሳይ ፈተናዎችን ማዋሃድ
            const uniqueMap = new Map();
            cleanAssessments.forEach(a => {
                const typeId = a.assessmentType.toString();
                if (uniqueMap.has(typeId)) {
                    uniqueMap.set(typeId, Math.max(uniqueMap.get(typeId), a.score));
                } else {
                    uniqueMap.set(typeId, a.score);
                }
            });

            const internalDupCount = cleanAssessments.length - uniqueMap.size;

            if (removedCount > 0 || internalDupCount > 0) {
                grade.assessments = Array.from(uniqueMap.entries()).map(([typeId, score]) => ({
                    assessmentType: new mongoose.Types.ObjectId(typeId),
                    score: score
                }));

                // finalScoreን በድጋሚ ደምሮ ማስቀመጥ
                grade.finalScore = grade.assessments.reduce((sum, a) => sum + (a.score || 0), 0);
                
                await grade.save();
                fixedCount++;
                console.log(`✅ Saved sanitized Grade sheet ID: ${grade._id}. New finalScore: ${grade.finalScore}`);
            }
        }

        console.log(`\n🎉 Deep Database sanitization complete! Fixed ${fixedCount} grade sheets.`);

    } catch (error) {
        console.error("❌ Sanitization failed:", error);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Connection closed.");
    }
};

sanitizeDatabase();