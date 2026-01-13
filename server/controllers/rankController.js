const Grade = require('../models/Grade');

// --- Helper: Check if Grade is KG ---
const isKindergarten = (gradeLevel) => {
    if (!gradeLevel) return false;
    // Matches "KG 1", "KG 2", "Nursery", "Pre-K" (case insensitive)
    return /^(kg|nursery|pre)/i.test(gradeLevel);
};

// @desc    Calculate a student's rank based on TOTAL SCORE
// @route   GET /api/ranks/class-rank/:studentId
exports.getStudentRank = async (req, res) => {
    const { studentId } = req.params;
    const { academicYear, semester, gradeLevel } = req.query;

    if (!academicYear || !semester || !gradeLevel) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    // --- FIX: NO RANK FOR KG ---
    if (isKindergarten(gradeLevel)) {
        return res.status(200).json({ rank: '-' });
    }

    try {
        const rankedList = await Grade.aggregate([
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
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
            {
                $sort: { totalScore: -1 }
            }
        ]);

        const index = rankedList.findIndex(item => item._id.toString() === studentId);

        if (index === -1) {
            return res.status(200).json({ rank: '-' });
        }

        const rankStr = `${index + 1} / ${rankedList.length}`;
        res.status(200).json({ rank: rankStr });

    } catch (error) {
        console.error('Error calculating rank:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// @desc    Calculate Overall Rank (Average of Sem 1 & Sem 2 Totals)
// @route   GET /api/ranks/overall-rank/:studentId
exports.getOverallRank = async (req, res) => {
    const { studentId } = req.params;
    const { academicYear, gradeLevel } = req.query;

    if (!academicYear || !gradeLevel) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    // --- FIX: NO RANK FOR KG ---
    if (isKindergarten(gradeLevel)) {
        return res.status(200).json({ rank: '-' });
    }

    try {
        const rankedList = await Grade.aggregate([
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
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
                    grandTotal: { $sum: '$finalScore' } 
                }
            },
            {
                $sort: { grandTotal: -1 }
            }
        ]);

        const index = rankedList.findIndex(item => item._id.toString() === studentId);

        if (index === -1) {
            return res.status(200).json({ rank: '-' });
        }

        const rankStr = `${index + 1} / ${rankedList.length}`;
        res.status(200).json({ rank: rankStr });

    } catch (error) {
        console.error('Error calculating overall rank:', error);
        res.status(500).json({ message: 'Server error' });
    }
};