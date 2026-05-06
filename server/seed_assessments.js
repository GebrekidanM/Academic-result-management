const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const AssessmentType = require('./models/AssessmentType');
const GlobalConfig = require('./models/GlobalConfig');

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

const assessmentsToCreate = [
    { name: 'Beginning of Term -BOT', totalMarks: 20, month: 'September' },
    { name: 'MID Term-MT', totalMarks: 30, month: 'October' },
    { name: 'End of Term-EOT', totalMarks: 50, month: 'December' }
];

async function seedAssessments() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const config = await GlobalConfig.findOne();
        if (!config) {
            console.log('Global config not found.');
            process.exit(1);
        }

        const { currentSemester, currentAcademicYear } = config;
        const subjects = await Subject.find();

        for (const subject of subjects) {
            for (const at of assessmentsToCreate) {
                const existing = await AssessmentType.findOne({
                    name: at.name,
                    subject: subject._id,
                    semester: currentSemester,
                    year: currentAcademicYear
                });

                if (!existing) {
                    await AssessmentType.create({
                        name: at.name,
                        totalMarks: at.totalMarks,
                        subject: subject._id,
                        class: subject.class,
                        month: at.month,
                        semester: currentSemester,
                        year: currentAcademicYear
                    });
                    console.log(`- Created ${at.name} for ${subject.name}`);
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

seedAssessments();
