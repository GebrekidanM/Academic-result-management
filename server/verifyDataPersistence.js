const mongoose = require('mongoose');
require('dotenv').config();

async function verifyDataPersistence() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/academic-management');
    console.log('🔍 Verifying Data Persistence...');
    console.log('=====================================');
    
    const Student = require('./models/Student');
    const Class = require('./models/Class');
    const Stream = require('./models/Stream');
    const Subject = require('./models/Subject');
    const User = require('./models/User');
    const GradingScale = require('./models/GradingScale');
    const Division = require('./models/Division');
    
    // Count all data
    const studentCount = await Student.countDocuments();
    const classCount = await Class.countDocuments();
    const streamCount = await Stream.countDocuments();
    const subjectCount = await Subject.countDocuments();
    const userCount = await User.countDocuments();
    const gradingScaleCount = await GradingScale.countDocuments();
    const divisionCount = await Division.countDocuments();
    
    console.log('\n📊 DATA COUNTS:');
    console.log(`Students: ${studentCount}`);
    console.log(`Classes: ${classCount}`);
    console.log(`Streams: ${streamCount}`);
    console.log(`Subjects: ${subjectCount}`);
    console.log(`Users: ${userCount}`);
    console.log(`Grading Scales: ${gradingScaleCount}`);
    console.log(`Divisions: ${divisionCount}`);
    
    // Verify class details
    console.log('\n🏫 CLASS VERIFICATION:');
    const classes = await Class.find().sort({ className: 1 });
    for (const cls of classes) {
      const streams = await Stream.find({ classId: cls._id }).sort({ streamName: 1 });
      const subjects = await Subject.find({ class: cls._id }).sort({ name: 1 });
      console.log(`${cls.className}:`);
      console.log(`  - Streams: ${streams.map(s => s.streamName).join(', ')}`);
      console.log(`  - Subjects: ${subjects.map(s => s.name).join(', ')}`);
      console.log(`  - Created: ${cls.createdAt.toISOString().split('T')[0]}`);
    }
    
    // Verify student details
    if (studentCount > 0) {
      console.log('\n👨‍🎓 STUDENT VERIFICATION:');
      const students = await Student.find().limit(3);
      for (const student of students) {
        const className = await Class.findById(student.class);
        const streamName = await Stream.findById(student.stream);
        console.log(`${student.studentId}: ${student.fullName}`);
        console.log(`  - Class: ${className ? className.className : 'Unknown'}`);
        console.log(`  - Stream: ${streamName ? streamName.streamName : 'Unknown'}`);
        console.log(`  - Status: ${student.status}`);
        console.log(`  - Created: ${student.createdAt.toISOString().split('T')[0]}`);
      }
    }
    
    // Verify grading scales and divisions
    console.log('\n📏 GRADING SYSTEM VERIFICATION:');
    const gradingScales = await GradingScale.find();
    const divisions = await Division.find();
    
    for (const scale of gradingScales) {
      console.log(`${scale.name} - Active: ${scale.isActive} - Classes: ${scale.applicableClasses.join(', ')}`);
    }
    
    for (const division of divisions) {
      console.log(`${division.name} - Active: ${division.isActive} - Classes: ${division.applicableClasses.join(', ')}`);
    }
    
    console.log('\n✅ DATA PERSISTENCE VERIFICATION COMPLETE');
    console.log('=====================================');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Verification error:', error);
  }
}

verifyDataPersistence();
