require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');
const cron = require('node-cron');


const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// ... existing requires
const performBackup = require('./utils/backup');
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
app.use('/api/library', require('./routes/LibraryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/report-cards', require('./routes/reports'));
app.use('/api/supportive-grades',require('./routes/supportiveGradeRoutes'))
app.use('/api/schedule',require('./routes/scheduleRoutes'))

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
        // 1. Connect to DB
        await connectDB();
        // 3. Seed Admin
        
        await seedAdminUser();

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
                    console.log(`🚀 Server running on port ${PORT}`);
                    
                    cron.schedule('0 22 */3 * *', () => {
                        performBackup();
                    });
                    console.log("📅 Automated backup job scheduled for 01:00 AM EAT");
                });

      } catch (error) {
          console.error("Failed to start server:", error);
            process.exit(1);
      }
};

// Execute the startup
startServer();