const mongoose = require('mongoose');
const Student = require('./models/Student'); // ⚠️ የሞዴል መንገድን ማረጋገጥህን አትርሳ
require('dotenv').config();

const backfillStudentYears = async () => {
    try {
        console.log("🔄 Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        console.log("🔄 Updating all legacy students to Year '2018' in bulk...");

        // ⚠️ በአንድ የዳታቤዝ ማዘዣ (Single Query) 'year' የሌላቸውን ተማሪዎች በሙሉ 2018 ያደርጋቸዋል [2]
        const result = await Student.updateMany(
            {
                $or: [
                    { year: { $exists: false } },
                    { year: null },
                    { year: "" }
                ]
            },
            {
                $set: { year: "2018" }
            }
        );

        console.log(`\n🎉 One-time Backfill Complete!`);
        console.log(`Matched: ${result.matchedCount} students.`);
        console.log(`Successfully updated: ${result.modifiedCount} students with Year "2018".`);

    } catch (error) {
        console.error("❌ Backfill failed:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Connection closed.");
    }
};

backfillStudentYears();