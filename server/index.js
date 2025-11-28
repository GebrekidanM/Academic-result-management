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
app.use('/api/delete-password', require('./deletePassword'));

// --- Models ---
const Grade = require('./models/Grade');
const AssessmentType = require('./models/AssessmentType');


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

//get grades with final score above 40
app.get('/api/admin/grades-no-assessments', async (req, res) => {
  try {
    const grades = await Grade.find({ finalScore: { $gt: 40 } });
    res.json(grades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching grades.' });
  }
});


app.post('/api/admin/cleanup-grades', async (req, res) => {
  try {
    const subjectId = "68ecd038c55e3e676b7e4e59"; // the subject ID you provided

    // 1. Load all valid AssessmentType IDs
    const validAssessmentTypes = await AssessmentType.find({}, '_id');
    const validIds = new Set(validAssessmentTypes.map(a => a._id.toString()));

    // 2. Get all grades for the subject
    const grades = await Grade.find({ subject: subjectId });

    const updatedGrades = [];

    // 3. Iterate and clean
    for (let grade of grades) {
      let originalFinalScore = grade.finalScore;
      let updated = false;

      const validAssessments = [];
      for (let assessment of grade.assessments) {
        if (validIds.has(assessment.assessmentType.toString())) {
          validAssessments.push(assessment);
        } else {
          // AssessmentType deleted → subtract its score
          grade.finalScore -= assessment.score;
          updated = true;
        }
      }

      if (updated) {
        grade.assessments = validAssessments;
        await grade.save();
        updatedGrades.push({
          gradeId: grade._id,
          oldFinalScore: originalFinalScore,
          newFinalScore: grade.finalScore
        });
      }
    }

    res.json({ message: 'Cleanup completed for subject.', updatedGrades });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during grade cleanup.' });
  }
});

// --- Server start ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  seedAdminUser();
});
