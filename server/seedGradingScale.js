require('dotenv').config();
const connectDB = require('./config/db');
const GradingScale = require('./models/GradingScale');

const seedGradingScale = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        const existingScale = await GradingScale.findOne({ name: 'Primary P4-P7' });
        if (existingScale) {
            console.log('Grading scale already exists');
            process.exit(0);
        }

        const gradingScale = new GradingScale({
            name: 'Primary P4-P7',
            schoolLevel: 'primary',
            applicableClasses: ['P4', 'P5', 'P6', 'P7'],
            ranges: [
                { grade: '1', minScore: 90, maxScore: 100 },
                { grade: 'D2', minScore: 80, maxScore: 89 },
                { grade: 'C3', minScore: 70, maxScore: 79 },
                { grade: 'C4', minScore: 60, maxScore: 69 },
                { grade: 'C5', minScore: 50, maxScore: 59 },
                { grade: 'C6', minScore: 45, maxScore: 49 },
                { grade: 'P7', minScore: 40, maxScore: 44 },
                { grade: 'P8', minScore: 35, maxScore: 39 },
                { grade: 'F9', minScore: 0, maxScore: 34 }
            ],
            isActive: true
        });

        await gradingScale.save();
        console.log('Grading scale seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding grading scale:', error);
        process.exit(1);
    }
};

seedGradingScale();
