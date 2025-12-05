require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');
const Student = require('./models/Student'); // Import Student

// --- Connect to MongoDB ---
// We will connect inside the start function now
// connectDB(); 

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/grades', require('./routes/gradeRoutes'));
app.use('/api/reports', require('./routes/behavioralReportRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ranks', require('./routes/rankRoutes'));
app.use('/api/rosters', require('./routes/rosterRoutes'));
app.use('/api/assessment-types', require('./routes/assessmentTypeRoutes'));
app.use('/api/student-auth', require('./routes/studentAuthRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/delete-password', require('./deletePassword'));

// --- Models ---
const Grade = require('./models/Grade');
const AssessmentType = require('./models/AssessmentType');

// --- Default admin seeding ---
const seedAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) return;

    console.log('⚙️ No admin user found. Creating default admin...');
    await User.create({
      fullName: 'Default Admin',
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin@123',
      role: 'admin'
    });
    console.log('✅ Default admin user created successfully!');
  } catch (error) {
    console.error('❌ Error during admin user seeding:', error);
  }
};

// --- DUPLICATE FIXER FUNCTION (Safe Version) ---
const fixDuplicatesSafely = async () => {
    try {
        console.log("🔍 Checking for Student ID duplicates...");

        // 1. Find duplicates
        const duplicates = await Student.aggregate([
            { $group: { _id: "$studentId", count: { $sum: 1 }, ids: { $push: "$_id" } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        if (duplicates.length === 0) {
            console.log("🎉 Data is clean. No duplicates found.");
            return; // Just return, DO NOT process.exit()
        }

        console.log(`⚠️ Found ${duplicates.length} IDs with duplicates. Fixing...`);

        // 2. Ethiopian Year Calculation
        const today = new Date();
        const gregorianYear = today.getFullYear();
        const gregorianMonth = today.getMonth() + 1;
        const currentYear = gregorianMonth > 8 ? gregorianYear - 7 : gregorianYear - 8;

        // 3. Find Max Sequence
        const lastStudent = await Student.findOne({
            studentId: new RegExp(`^FKS-${currentYear}`)
        }).sort({ studentId: -1 });

        let nextSequence = 0;
        if (lastStudent && lastStudent.studentId) {
            const parts = lastStudent.studentId.split('-');
            if(parts.length === 3) nextSequence = parseInt(parts[2], 10);
        }

        // 4. Fix Loop
        for (const group of duplicates) {
            const duplicateIds = group.ids;
            const students = await Student.find({ _id: { $in: duplicateIds } }).sort({ createdAt: 1 });

            // Skip index 0 (keep original), fix the rest
            for (let i = 1; i < students.length; i++) {
                const studentToFix = students[i];
                nextSequence++;
                const newId = `FKS-${currentYear}-${String(nextSequence).padStart(3, '0')}`;

                console.log(`🛠 Fixing ${studentToFix.fullName}: ${studentToFix.studentId} -> ${newId}`);

                await Student.updateOne(
                    { _id: studentToFix._id },
                    { $set: { studentId: newId } }
                );
            }
        }
        console.log('✅ All duplicates fixed successfully.');
        
    } catch (error) {
        console.error('❌ Error in duplicate fixer:', error);
        // We don't exit here either, so the server can still try to run
    }
};

// --- STARTUP SEQUENCE ---
const startServer = async () => {
    try {
        // 1. Connect to DB
        await connectDB();

        // 2. Run Cleanup (Wait for it to finish!)
        await fixDuplicatesSafely();

        // 3. Seed Admin
        await seedAdminUser();

        // 4. Start Server
        const PORT = process.env.PORT || 5001;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1); // Only exit if DB connection fails completely
    }
};

// Execute the startup
startServer();