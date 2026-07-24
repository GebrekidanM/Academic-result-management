require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');
const cron = require('node-cron');
const runMigration = require('./utils/migrateGrade')
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use(express.urlencoded({ extended: true }));

// ... existing requires
const {performBackup} = require('./utils/backup');

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
app.use('/api/library', require('./routes/LibraryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/report-cards', require('./routes/reports'));
app.use('/api/supportive-grades',require('./routes/supportiveGradeRoutes'));
app.use('/api/schedule',require('./routes/scheduleRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/assessment-names', require('./routes/assessmentNameRoutes'))
app.use('/api/attendance', require("./routes/attendanceRoutes"));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use((err, req, res, next) => {
    console.error("❌ Express Global Error Caught:", err);
    res.status(500).json({ 
        success: false, 
        message: err.message || "An unexpected error occurred inside middleware",
        error: err
    });
});


app.get('/api/admin/temp-sanitize-db', async (req, res) => {
    try {
        await convertYearsToString();
        res.status(200).json({ message: "Database sanitized successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
      role: 'admin',
      schoolLevel: 'all'
    });
    console.log('✅ Default admin user created successfully!');
  } catch (error) {
    console.error('❌ Error during admin user seeding:', error);
  }
};

// --- STARTUP SEQUENCE ---
const startServer = async () => {
    try {
        await connectDB();
        await seedAdminUser();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);

            cron.schedule('0 1 */3 * *', async () => { 
                console.log(`[${new Date().toISOString()}] 🕒 Cron job triggered...`);
                try {
                    await performBackup();
                    console.log(`[${new Date().toISOString()}] ✅ Backup performed successfully.`);
                } catch (error) {
                    console.error(`[${new Date().toISOString()}] ❌ Backup failed:`, error);
                }
            }, {
                timezone: "Africa/Addis_Ababa"
            });
            
            console.log("📅 Automated backup job scheduled for 01:00 AM EAT");
        });
      } catch (error) {
          console.error("Failed to start server:", error);
            process.exit(1);
      }
};

startServer();