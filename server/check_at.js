const mongoose = require('mongoose');
require('dotenv').config();
require('./models/Subject');
const AssessmentType = require('./models/AssessmentType');
const Class = require('./models/Class');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const p7 = await Class.findOne({ className: 'P7' });
    const ats = await AssessmentType.find({ class: p7._id }).populate('subject', 'name').sort('name');
    console.log(`Assessment Types for P7 (${ats.length} total):`);
    const seen = new Set();
    ats.forEach(at => {
        const key = `${at.name}|${at.totalMarks}|${at.semester}`;
        if (!seen.has(key)) {
            seen.add(key);
            console.log(` - name: "${at.name}" | totalMarks: ${at.totalMarks} | semester: ${at.semester} | year: ${at.year}`);
        }
    });
    process.exit();
});
