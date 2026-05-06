const mongoose = require('mongoose');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

const subjectsToAdd = [
    { name: 'Mathematics', code: 'Math' },
    { name: 'English', code: 'Eng' },
    { name: 'Science', code: 'Sci' },
    { name: 'Social Studies', code: 'SST' }
];

const targetClasses = ['P4', 'P5', 'P6', 'P7'];

async function seedSubjects() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        for (const className of targetClasses) {
            const classDoc = await Class.findOne({ className });
            if (!classDoc) {
                console.log(`Class ${className} not found, skipping.`);
                continue;
            }

            console.log(`Adding subjects to ${className}...`);
            for (const sub of subjectsToAdd) {
                // Check if subject with this name exists for this class
                const existing = await Subject.findOne({ name: sub.name, class: classDoc._id });
                if (existing) {
                    console.log(`- Subject ${sub.name} already exists for ${className}`);
                } else {
                    await Subject.create({
                        name: sub.name,
                        code: sub.code,
                        class: classDoc._id,
                        sessionsPerWeek: 5 // Default
                    });
                    console.log(`- Added ${sub.name} to ${className}`);
                }
            }
        }

        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedSubjects();
