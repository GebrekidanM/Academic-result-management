require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');
const GradingScale = require('./models/GradingScale');
const Division = require('./models/Division');
const Class = require('./models/Class');
const Stream = require('./models/Stream');
const Subject = require('./models/Subject');
const cron = require('node-cron');


const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
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
app.use('/api/delete-password', require('./deletePassword'));
app.use('/api/library', require('./routes/LibraryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/report-cards', require('./routes/reports'));
app.use('/api/supportive-grades',require('./routes/supportiveGradeRoutes'))
app.use('/api/schedule',require('./routes/scheduleRoutes'))
app.use('/api/quizzes', require('./routes/quizRoutes'))
app.use('/api/classes', require('./routes/classRoutes'))
app.use('/api/config', require('./routes/configRoutes'))
app.use('/api/semesters', require('./routes/semesterRoutes'))
app.use('/api/grading-scales', require('./routes/gradingScaleRoutes'))
app.use('/api/divisions', require('./routes/divisionRoutes'))

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

// --- Grading scale seeding ---
const seedGradingScale = async () => {
  try {
    let existingScale = await GradingScale.findOne({ name: 'Primary P4-P7' });
    if (!existingScale) {
      console.log('⚙️ No P4-P7 grading scale found. Creating...');
      await GradingScale.create({
        name: 'Primary P4-P7',
        schoolLevel: 'primary',
        applicableClasses: ['P4', 'P5', 'P6', 'P7'],
        ranges: [
          { grade: '1', minScore: 90, maxScore: 100 },
          { grade: 'D2', minScore: 80, maxScore: 89 },
          { grade: 'C3', minScore: 70, maxScore: 79 },
          { grade: 'C4', minScore: 60, maxScore: 69 },
          { grade: 'C5', minScore: 50, maxScore: 59 },
          { grade: 'C6', minScore: 45, maxScore: 49 },
          { grade: 'P7', minScore: 40, maxScore: 44 },
          { grade: 'P8', minScore: 35, maxScore: 39 },
          { grade: 'F9', minScore: 0, maxScore: 34 }
        ],
        isActive: true
      });
      console.log('✅ P4-P7 grading scale created!');
    }

    existingScale = await GradingScale.findOne({ name: 'Primary P1-P3' });
    if (!existingScale) {
      console.log('⚙️ No P1-P3 grading scale found. Creating...');
      await GradingScale.create({
        name: 'Primary P1-P3',
        schoolLevel: 'primary',
        applicableClasses: ['P1', 'P2', 'P3'],
        ranges: [
          { grade: '1', minScore: 90, maxScore: 100 },
          { grade: 'D2', minScore: 80, maxScore: 89 },
          { grade: 'C3', minScore: 70, maxScore: 79 },
          { grade: 'C4', minScore: 60, maxScore: 69 },
          { grade: 'C5', minScore: 50, maxScore: 59 },
          { grade: 'C6', minScore: 45, maxScore: 49 },
          { grade: 'P7', minScore: 40, maxScore: 44 },
          { grade: 'P8', minScore: 35, maxScore: 39 },
          { grade: 'F9', minScore: 0, maxScore: 39 }
        ],
        isActive: true
      });
      console.log('✅ P1-P3 grading scale created!');
    } else {
      // If P1-P3 scale exists, ensure it's active
      await GradingScale.updateOne(
        { name: 'Primary P1-P3' },
        { isActive: true }
      );
      console.log('✅ P1-P3 grading scale activated!');
    }
  } catch (error) {
    console.error('Error seeding grading scales:', error);
  }
};

// --- Division seeding ---
const seedDivision = async () => {
  try {
    let existingDivision = await Division.findOne({ name: 'Primary P4-P7' });
    if (!existingDivision) {
      console.log('⚙️ No P4-P7 division found. Creating...');
      await Division.create({
        name: 'Primary P4-P7',
        schoolLevel: 'primary',
        applicableClasses: ['P4', 'P5', 'P6', 'P7'],
        ranges: [
          { division: 'Div 1', minScore: 4, maxScore: 12 },
          { division: 'Div 2', minScore: 13, maxScore: 24 },
          { division: 'Div 3', minScore: 25, maxScore: 29 },
          { division: 'Div 4', minScore: 30, maxScore: 33 },
          { division: 'Div U', minScore: 34, maxScore: 36 }
        ],
        isActive: true
      });
      console.log('✅ P4-P7 division created!');
    }

    existingDivision = await Division.findOne({ name: 'Primary P1-P3' });
    if (!existingDivision) {
      console.log('⚙️ No P1-P3 division found. Creating...');
      await Division.create({
        name: 'Primary P1-P3',
        schoolLevel: 'primary',
        applicableClasses: ['P1', 'P2', 'P3'],
        ranges: [
          { division: 'Div 1', minScore: 6, maxScore: 18 },
          { division: 'Div 2', minScore: 19, maxScore: 36 },
          { division: 'Div 3', minScore: 37, maxScore: 44 },
          { division: 'Div 4', minScore: 45, maxScore: 50 },
          { division: 'Div U', minScore: 51, maxScore: 54 }
        ],
        isActive: true
      });
      console.log('✅ P1-P3 division created!');
    } else {
      // If P1-P3 division exists, ensure it's active
      await Division.updateOne(
        { name: 'Primary P1-P3' },
        { isActive: true }
      );
      console.log('✅ P1-P3 division activated!');
    }
  } catch (error) {
    console.error('Error seeding divisions:', error);
  }
};

// --- Classes and Streams seeding ---
const seedClassesAndStreams = async () => {
  try {
    // Create classes P1-P7 if they don't exist
    const primaryClasses = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'];
    
    for (const className of primaryClasses) {
      let existingClass = await Class.findOne({ className });
      if (!existingClass) {
        console.log(`⚙️ No ${className} class found. Creating...`);
        const newClass = await Class.create({
          className: className,
          schoolLevel: 'primary'
        });
        console.log(`✅ ${className} class created!`);

        // Create streams for each class
        const streams = className === 'P7' ? ['P', 'Q', 'R', 'S'] : ['A', 'B', 'C', 'D'];
        
        for (const streamName of streams) {
          const existingStream = await Stream.findOne({ streamName, classId: newClass._id });
          if (!existingStream) {
            await Stream.create({
              streamName: streamName,
              classId: newClass._id
            });
            console.log(`✅ ${className} - Stream ${streamName} created!`);
          }
        }
      } else {
        // Check if streams exist for existing class
        const streams = className === 'P7' ? ['P', 'Q', 'R', 'S'] : ['A', 'B', 'C', 'D'];
        const existingStreams = await Stream.find({ classId: existingClass._id });
        
        if (existingStreams.length === 0) {
          console.log(`⚙️ No streams found for ${className}. Creating streams...`);
          for (const streamName of streams) {
            await Stream.create({
              streamName: streamName,
              classId: existingClass._id
            });
            console.log(`✅ ${className} - Stream ${streamName} created!`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error seeding classes and streams:', error);
  }
};

// --- Subjects seeding ---
const seedSubjects = async () => {
  try {
    // Define subjects for P1-P3
    const p1to3Subjects = [
      { name: 'Literacy 1', code: 'LIT1' },
      { name: 'English', code: 'ENG' },
      { name: 'Local Language', code: 'LOC' },
      { name: 'Literacy 2', code: 'LIT2' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Religious Education', code: 'RE' }
    ];

    // Define subjects for P4-P7
    const p4to7Subjects = [
      { name: 'English', code: 'ENG' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Science', code: 'SCI' },
      { name: 'Social Studies', code: 'SST' }
    ];

    // Get P1-P3 classes
    const p1to3Classes = await Class.find({ 
      className: { $in: ['P1', 'P2', 'P3'] }
    });

    // Get P4-P7 classes
    const p4to7Classes = await Class.find({ 
      className: { $in: ['P4', 'P5', 'P6', 'P7'] }
    });

    // Create subjects for P1-P3
    for (const cls of p1to3Classes) {
      for (const subject of p1to3Subjects) {
        const existingSubject = await Subject.findOne({ 
          name: subject.name, 
          class: cls._id 
        });
        
        if (!existingSubject) {
          console.log(`⚙️ No ${subject.name} subject found for ${cls.className}. Creating...`);
          await Subject.create({
            name: subject.name,
            code: subject.code,
            class: cls._id,
            sessionsPerWeek: 3
          });
          console.log(`✅ ${cls.className} - ${subject.name} subject created!`);
        }
      }
    }

    // Create subjects for P4-P7
    for (const cls of p4to7Classes) {
      for (const subject of p4to7Subjects) {
        const existingSubject = await Subject.findOne({ 
          name: subject.name, 
          class: cls._id 
        });
        
        if (!existingSubject) {
          console.log(`⚙️ No ${subject.name} subject found for ${cls.className}. Creating...`);
          await Subject.create({
            name: subject.name,
            code: subject.code,
            class: cls._id,
            sessionsPerWeek: 3
          });
          console.log(`✅ ${cls.className} - ${subject.name} subject created!`);
        }
      }
    }
  } catch (error) {
    console.error('Error seeding subjects:', error);
  }
};


// --- STARTUP SEQUENCE ---
const startServer = async () => {
    try {
        // 1. Connect to DB
        await connectDB();
        // 3. Seed Admin
        
        await seedAdminUser();
        await seedGradingScale();
        await seedDivision();
        await seedClassesAndStreams();
        await seedSubjects();

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