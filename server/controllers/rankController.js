const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Class = require('../models/Class');
const mongoose = require('mongoose');

// --- Helper: Check if Grade is KG ---
// --- Helper: Check if Class is KG ---
const isKindergarten = async (classId) => {
    if (!classId) return false;
    const cls = await Class.findById(classId);
    return cls?.schoolLevel === 'kg';
};

// --- Helper: Calculate Rank with Tie-Breaking ---
const findRankInList = (sortedList, targetStudentId, scoreField) => {
    let rank = 0;
    
    for (let i = 0; i < sortedList.length; i++) {
        // If first student OR score is lower than previous, update rank
        if (i === 0 || sortedList[i][scoreField] < sortedList[i - 1][scoreField]) {
            rank = i + 1;
        }

        if (sortedList[i]._id.toString() === targetStudentId) {
            return `${rank} / ${sortedList.length}`;
        }
    }
    return '-';
};

// 1. SEMESTER RANK (Based on Total Score)
exports.getSemesterRank = async (req, res) => {
    const { studentId } = req.params;
    const { academicYear, semester, classId } = req.query;
    
    // Handle URL-encoded parameters
    const decodedSemester = semester ? semester.replace(/\+/g, ' ') : '';
    const decodedClassId = classId ? classId.replace(/\+/g, ' ') : '';

    if (!academicYear || !semester || !classId) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    if (await isKindergarten(classId)) return res.status(200).json({ rank: '-' });

    try {
        const rankedList = await Grade.aggregate([
            { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
            { $unwind: '$studentInfo' },
            {
                $match: {
                    'studentInfo.class': new mongoose.Types.ObjectId(decodedClassId),
                    'studentInfo.status': 'Active',
                    academicYear: academicYear,
                    semester: decodedSemester
                }
            },
            {
                $group: {
                    _id: '$student', 
                    totalScore: { $sum: '$finalScore' } 
                }
            },
            { $sort: { totalScore: -1 } }
        ]);

        const rankStr = findRankInList(rankedList, studentId, 'totalScore');
        res.status(200).json({ rank: rankStr });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 2. OVERALL RANK (Based on Average)
exports.getOverallRank = async (req, res) => {
    const { studentId } = req.params;
    const { academicYear, classId } = req.query;
    
    // Handle URL-encoded parameters
    const decodedClassId = classId ? classId.replace(/\+/g, ' ') : '';

    if (!academicYear || !classId) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    if (await isKindergarten(classId)) return res.status(200).json({ rank: '-' });

    try {
        const rankedList = await Grade.aggregate([
            { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
            { $unwind: '$studentInfo' },
            {
                $match: {
                    'studentInfo.class': new mongoose.Types.ObjectId(decodedClassId),
                    'studentInfo.status': 'Active',
                    academicYear: academicYear,
                }
            },
            {
                $group: {
                    _id: '$student', 
                    overallAverage: { $avg: '$finalScore' } 
                }
            },
            { $sort: { overallAverage: -1 } }
        ]);

        const rankStr = findRankInList(rankedList, studentId, 'overallAverage');
        res.status(200).json({ rank: rankStr });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

