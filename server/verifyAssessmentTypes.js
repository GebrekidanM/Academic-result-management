const mongoose = require('mongoose');
require('dotenv').config();

async function verifyAssessmentTypes() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/academic-management');
    console.log('🔍 Verifying Assessment Types...');
    console.log('=====================================');
    
    const AssessmentType = require('./models/AssessmentType');
    const Subject = require('./models/Subject');
    
    const assessmentTypeCount = await AssessmentType.countDocuments();
    const subjectCount = await Subject.countDocuments();
    
    console.log('\n📊 ASSESSMENT TYPE COUNTS:');
    console.log(`Assessment Types: ${assessmentTypeCount}`);
    console.log(`Subjects: ${subjectCount}`);
    
    if (assessmentTypeCount > 0) {
      const assessmentTypes = await AssessmentType.find().populate('subject', 'name').populate('class', 'className');
      console.log('\n📋 ASSESSMENT TYPES VERIFICATION:');
      
      // Group by assessment type name
      const groupedTypes = {};
      for (const assessmentType of assessmentTypes) {
        const typeName = assessmentType.name;
        if (!groupedTypes[typeName]) {
          groupedTypes[typeName] = [];
        }
        groupedTypes[typeName].push({
          subject: assessmentType.subject ? assessmentType.subject.name : 'Unknown',
          class: assessmentType.class ? assessmentType.class.className : 'Unknown',
          totalMarks: assessmentType.totalMarks,
          semester: assessmentType.semester,
          month: assessmentType.month,
          year: assessmentType.year
        });
      }
      
      for (const [typeName, types] of Object.entries(groupedTypes)) {
        console.log(`\n${typeName} (${types.length} entries):`);
        for (const type of types) {
          console.log(`  - ${type.subject} (${type.class}) - ${type.totalMarks} marks - ${type.semester} ${type.year}`);
        }
      }
    }
    
    console.log('\n✅ ASSESSMENT TYPE VERIFICATION COMPLETE');
    console.log('=====================================');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Verification error:', error);
  }
}

verifyAssessmentTypes();
