require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');

// --- Connect to MongoDB ---
connectDB();

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
const Grade = require('./models/Grade');

// --- Admin utility to clean duplicate assessments ---
app.post('/api/admin/clean-duplicates', async (req, res) => {
  try {
    const grades = await Grade.find({});
    for (const grade of grades) {
      const seen = new Map();
      const cleaned = [];

      for (const assessment of grade.assessments) {
        const id = assessment.assessmentType.toString();
        if (!seen.has(id)) seen.set(id, assessment);
        else seen.set(id, assessment); // keep latest
      }

      grade.assessments = Array.from(seen.values());
      grade.finalScore = grade.assessments.reduce((sum, a) => sum + (a.score || 0), 0);
      await grade.save();
    }

    res.json({ message: '✅ Duplicate assessments cleaned successfully!' });
  } catch (error) {
    console.error(error);
    
    res.status(500).json({ message: 'Server error cleaning duplicates.' });
  }
})

//to delete grades with out assessment types

app.post('/api/admin/removegrade', async (req, res) => {
  try {
    const result = await Grade.deleteMany({ assessments: { $size: 0 } });
    res.json({ message: `✅ Deleted ${result.deletedCount} grades without assessments.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting grades.' });
  }
})
// --- Default admin seeding ---
const seedAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('✅ Admin user already exists.');
      return;
    }

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

//get grades with no assessments
app.get('/api/admin/grades-no-assessments', async (req, res) => {
  try {
    const grades = await Grade.find({ assessments: { $size: 0 } });
    res.json(grades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching grades.' });
  }
});
// --- Server start ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  seedAdminUser();
});
