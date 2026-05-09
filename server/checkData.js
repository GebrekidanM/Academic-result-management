const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/academic-management');
    console.log('Connected to MongoDB');
    
    const Student = require('./models/Student');
    const Class = require('./models/Class');
    const Stream = require('./models/Stream');
    const Subject = require('./models/Subject');
    const User = require('./models/User');
    
    const studentCount = await Student.countDocuments();
    const classCount = await Class.countDocuments();
    const streamCount = await Stream.countDocuments();
    const subjectCount = await Subject.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log('Student count:', studentCount);
    console.log('Class count:', classCount);
    console.log('Stream count:', streamCount);
    console.log('Subject count:', subjectCount);
    console.log('User count:', userCount);
    
    if (studentCount > 0) {
      const sampleStudent = await Student.findOne().limit(1);
      console.log('Sample student:', sampleStudent);
    }
    
    if (classCount > 0) {
      const sampleClass = await Class.findOne().limit(1);
      console.log('Sample class:', sampleClass);
    }
    
    if (streamCount > 0) {
      const sampleStream = await Stream.findOne().limit(1);
      console.log('Sample stream:', sampleStream);
    }
    
    // Show all classes and their streams
    if (classCount > 0) {
      const classes = await Class.find().sort({ className: 1 });
      console.log('\nAll classes:');
      for (const cls of classes) {
        const streams = await Stream.find({ classId: cls._id }).sort({ streamName: 1 });
        console.log(`${cls.className}: ${streams.map(s => s.streamName).join(', ')}`);
      }
    }
    
    // Show subjects for P4-P7 classes
    if (subjectCount > 0) {
      const p4to7Classes = await Class.find({ className: { $in: ['P4', 'P5', 'P6', 'P7'] } }).sort({ className: 1 });
      console.log('\nSubjects for P4-P7:');
      for (const cls of p4to7Classes) {
        const subjects = await Subject.find({ class: cls._id }).sort({ name: 1 });
        console.log(`${cls.className}: ${subjects.map(s => s.name).join(', ')}`);
      }
    }
    
    // Show subjects for P1-P3 classes
    if (subjectCount > 0) {
      const p1to3Classes = await Class.find({ className: { $in: ['P1', 'P2', 'P3'] } }).sort({ className: 1 });
      console.log('\nSubjects for P1-P3:');
      for (const cls of p1to3Classes) {
        const subjects = await Subject.find({ class: cls._id }).sort({ name: 1 });
        console.log(`${cls.className}: ${subjects.map(s => s.name).join(', ')}`);
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkData();
