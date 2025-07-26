require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const User = require('./models/User'); 
// Import routes
const studentRoutes = require('./routes/studentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const reportRoutes = require('./routes/behavioralReportRoutes');
const authRoutes = require('./routes/authRoutes');
const rankRoutes = require('./routes/rankRoutes'); 
const rosterRoutes = require('./routes/rosterRoutes');
const assessmentTypeRoutes = require('./routes/assessmentTypeRoutes');
const userRoutes = require('./routes/userRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const studentAuthRoutes = require('./routes/studentAuthRoutes');
// Connect to Database
connectDB();

const app = express();
app.use(express.json());
// Middleware
app.use(cors());



const seedAdminUser = async () => {
    try {
        // 1. Check if any admin user already exists in the database.
        const adminExists = await User.findOne({ role: 'admin' });

        // 2. If an admin already exists, do nothing.
        if (adminExists) {
            console.log('Admin user already exists. Seeding not required.');
            return;
        }

        // 3. If no admin exists, create a default one.
        console.log('No admin user found. Creating default admin...');
        
        await User.create({
            fullName: 'Default Admin',
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin123', // This will be hashed
            role: 'admin'
        });

        console.log('Default admin user created successfully!');

    } catch (error) {
        console.error('Error during admin user seeding:', error);
    }
};

// Define API Routes
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ranks', rankRoutes);
app.use('/api/rosters', rosterRoutes);
app.use('/api/assessment-types', assessmentTypeRoutes);
app.use('/api/users', userRoutes);

app.use('/api/student-auth', studentAuthRoutes); 
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/analytics', analyticsRoutes);
// ...
app.get('/api', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    seedAdminUser();
});