require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const run = async () => {
    await connectDB();
    const AT = require('./models/AssessmentType');
    const Class = require('./models/Class');
    const Student = require('./models/Student');

    // Find a class that has students
    const classes = await Class.find();
    console.log('Classes:', classes.map(c => ({ id: c._id, name: c.className })));

    for (const cls of classes) {
        const count = await Student.countDocuments({ class: cls._id });
        if (count === 0) continue;

        const ats = await AT.find({ class: cls._id });
        console.log(`\nClass ${cls.className} (${count} students) — ${ats.length} ATs:`);
        ats.slice(0, 6).forEach(a => console.log(`  name="${a.name}" semester="${a.semester}" year=${a.year}`));
        break;
    }

    process.exit(0);
};

run().catch(e => { console.error(e.message); process.exit(1); });
