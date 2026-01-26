const SupportiveGrade = require('../models/SupportiveGrade');
const SupportiveSubject = require('../models/SupportiveSubject');
const Student = require('../models/Student');

// @desc    Get subjects and existing grades for a class
// @route   GET /api/supportive-grades/sheet
exports.getGradingSheet = async (req, res) => {
    try {
        const { gradeLevel, academicYear, semester } = req.query;

        // 1. Get Subjects for this Grade Level
        const subjects = await SupportiveSubject.find({ gradeLevel });

        // 2. Get Students in this Grade
        const students = await Student.find({ gradeLevel, status: 'Active' })
            .select('fullName studentId _id')
            .sort({ fullName: 1 });

        // 3. Get Existing Grades
        const grades = await SupportiveGrade.find({ 
            academicYear, 
            semester,
            student: { $in: students.map(s => s._id) }
        });

        res.json({ success: true, subjects, students, grades });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Save/Update Grades in Bulk
// @route   POST /api/supportive-grades/save
exports.saveGrades = async (req, res) => {
    try {
        const { gradesData, academicYear, semester } = req.body; 
        // gradesData example: [ { student: 'ID', subject: 'ID', score: 'A' }, ... ]

        const bulkOps = gradesData.map(item => ({
            updateOne: {
                filter: { 
                    student: item.student, 
                    subject: item.subject,
                    academicYear, 
                    semester 
                },
                update: { $set: { score: item.score } },
                upsert: true // Create if doesn't exist
            }
        }));

        if (bulkOps.length > 0) {
            await SupportiveGrade.bulkWrite(bulkOps);
        }

        res.json({ success: true, message: 'Grades saved successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error saving grades' });
    }
};

// @desc    Get all supportive subjects
// @route   GET /api/supportive-subjects
exports.getAllSupportiveSubjects = async (req, res) => {
    try {
        const subjects = await SupportiveSubject.find().sort({ gradeLevel: 1, name: 1 });
        res.json({ success: true, data: subjects });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new supportive subject
// @route   POST /api/supportive-subjects
exports.createSupportiveSubject = async (req, res) => {
    try {
        const { name, gradeLevel } = req.body;
        const exists = await SupportiveSubject.findOne({ name, gradeLevel });
        if (exists) {
            return res.status(400).json({ message: 'Subject already exists for this grade.' });
        }

        const newSubject = await SupportiveSubject.create({ name, gradeLevel });
        res.status(201).json({ success: true, data: newSubject });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a subject
// @route   DELETE /api/supportive-subjects/:id
exports.deleteSupportiveSubject = async (req, res) => {
    try {
        await SupportiveSubject.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};