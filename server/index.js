require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const User = require('./models/User'); 

// --- 1. Import ALL your routes first ---
const studentRoutes = require('./routes/studentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const reportRoutes = require('./routes/behavioralReportRoutes');
const authRoutes = require('./routes/authRoutes');
const rankRoutes = require('./routes/rankRoutes'); 
const rosterRoutes = require('./routes/rosterRoutes');
const assessmentTypeRoutes = require('./routes/assessmentTypeRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const studentAuthRoutes = require('./routes/studentAuthRoutes');

connectDB();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/students', studentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ranks', rankRoutes);
app.use('/api/rosters', rosterRoutes);
app.use('/api/assessment-types', assessmentTypeRoutes);
app.use('/api/student-auth', studentAuthRoutes); 
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);

const seedAdminUser = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            console.log('Admin user already exists. Seeding not required.');
            return;
        }

        console.log('No admin user found. Creating default admin...');
        
        await User.create({
            fullName: 'Default Admin',
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin@123',
            role: 'admin'
        });

        console.log('Default admin user created successfully!');

    } catch (error) {
        console.error('Error during admin user seeding:', error);
    }
};

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    seedAdminUser();
});