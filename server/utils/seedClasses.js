const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Class = require('../models/Class');
const Stream = require('../models/Stream');
const Student = require('../models/Student');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const Subject = require('../models/Subject');
const SupportiveSubject = require('../models/SupportiveSubject');
const Quiz = require('../models/Quiz');
const AssessmentType = require('../models/AssessmentType');
const LibraryResource = require('../models/LibraryResources');

dotenv.config({ path: './.env' });

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // 1. Wipe everything related to grades/students/schedules etc.
        console.log('Wiping old data...');
        await Student.deleteMany({});
        await Schedule.deleteMany({});
        await Subject.deleteMany({});
        await SupportiveSubject.deleteMany({});
        await Quiz.deleteMany({});
        await AssessmentType.deleteMany({});
        await LibraryResource.deleteMany({});
        await Class.deleteMany({});
        await Stream.deleteMany({});
        
        // Reset users' homeroom
        await User.updateMany({}, { $set: { homeroomClass: null, homeroomStream: null } });

        console.log('Data wiped.');

        // 2. Create P1 to P7 classes
        const classes = [
            { className: 'P1', schoolLevel: 'primary' },
            { className: 'P2', schoolLevel: 'primary' },
            { className: 'P3', schoolLevel: 'primary' },
            { className: 'P4', schoolLevel: 'primary' },
            { className: 'P5', schoolLevel: 'primary' },
            { className: 'P6', schoolLevel: 'primary' },
            { className: 'P7', schoolLevel: 'primary' },
        ];

        const createdClasses = await Class.insertMany(classes);
        console.log('Classes P1-P7 created.');

        // 3. Create default streams for each class (e.g., A and B)
        for (const cls of createdClasses) {
            await Stream.create([
                { streamName: 'A', classId: cls._id },
                { streamName: 'B', classId: cls._id }
            ]);
        }
        console.log('Default streams A and B created for each class.');

        console.log('Seeding completed successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seed();
