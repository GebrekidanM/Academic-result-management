const mongoose = require('mongoose');
require('dotenv').config();
require('./models/Subject');
require('./models/Student');
require('./models/AssessmentType');
const Grade = require('./models/Grade');
const Student = require('./models/Student');
const Class = require('./models/Class');
const Stream = require('./models/Stream');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const p7 = await Class.findOne({ className: 'P7' });
    const streamS = await Stream.findOne({ classId: p7._id, streamName: 'S' });

    // Get first 3 students in P7/S
    const students = await Student.find({ class: p7._id, stream: streamS._id }).limit(5);
    
    for (const s of students) {
        const grades = await Grade.find({ student: s._id })
            .populate('subject', 'name')
            .populate('assessments.assessmentType', 'name totalMarks');
        
        console.log(`\n${s.fullName}:`);
        if (!grades.length) {
            console.log('  No grades found');
        }
        for (const g of grades) {
            console.log(`  Subject: ${g.subject?.name}, finalScore: ${g.finalScore}`);
            g.assessments.forEach(a => {
                console.log(`    - ${a.assessmentType?.name} (max ${a.assessmentType?.totalMarks}): ${a.score}`);
            });
        }
    }
    process.exit();
});
