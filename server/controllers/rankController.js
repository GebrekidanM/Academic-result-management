const Grade = require('../models/Grade');
const Student = require('../models/Student');

// --- Helper: Check if Grade is KG ---
const isKindergarten = (gradeLevel) => {
    if (!gradeLevel) return false;
    return /^(kg|nursery|pre)/i.test(gradeLevel);
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
    const { academicYear, semester, gradeLevel } = req.query;

    if (!academicYear || !semester || !gradeLevel) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    if (isKindergarten(gradeLevel)) return res.status(200).json({ rank: '-' });

    try {
        const rankedList = await Grade.aggregate([
            { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
            { $unwind: '$studentInfo' },
            {
                $match: {
                    'studentInfo.gradeLevel': gradeLevel,
                    'studentInfo.status': 'Active',
                    academicYear: academicYear,
                    semester: semester
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
    const { academicYear, gradeLevel } = req.query;

    if (!academicYear || !gradeLevel) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    if (isKindergarten(gradeLevel)) return res.status(200).json({ rank: '-' });

    try {
        const rankedList = await Grade.aggregate([
            { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
            { $unwind: '$studentInfo' },
            {
                $match: {
                    'studentInfo.gradeLevel': gradeLevel,
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

