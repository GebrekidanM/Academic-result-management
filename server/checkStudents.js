require('dotenv').config();
const connectDB = require('./config/db');

const run = async () => {
    await connectDB();
    const Student = require('./models/Student');
    const Class = require('./models/Class');
    const Stream = require('./models/Stream');

    const cls = await Class.findOne({ className: 'P7' });
    const streams = await Stream.find({ classId: cls._id });
    console.log('P7 streams:', streams.map(s => ({ id: s._id, name: s.streamName })));

    // Show first stream's students
    if (streams.length > 0) {
        const students = await Student.find({ class: cls._id, stream: streams[0]._id }).limit(10);
        console.log(`\nFirst 10 students in P7-${streams[0].streamName}:`);
        students.forEach(s => console.log(' ', s.fullName));
    }

    process.exit(0);
};

run().catch(e => { console.error(e.message); process.exit(1); });
