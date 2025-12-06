const Grade = require('../models/Grade');

// @desc    Calculate a student's rank based on TOTAL SCORE
// @route   GET /api/ranks/class-rank/:studentId
exports.getStudentRank = async (req, res) => {
    const { studentId } = req.params;
    const { academicYear, semester, gradeLevel } = req.query;

    if (!academicYear || !semester || !gradeLevel) {
        return res.status(400).json({ message: 'Year, semester, and grade level are required' });
    }

    try {
        const rankedList = await Grade.aggregate([
            // 1. Join with Student data to check Grade Level & Status
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentInfo'
                }
            },
            { $unwind: '$studentInfo' },
            
            // 2. Filter: Match Grade, Semester, Year, AND Active Status
            {
                $match: {
                    'studentInfo.gradeLevel': gradeLevel,
                    'studentInfo.status': 'Active', // <--- IMPORTANT: Ignore inactive students
                    academicYear: academicYear,
                    semester: semester
                }
            },

            // 3. Group by Student and Sum their Final Scores
            {
                $group: {
                    _id: '$student', 
                    totalScore: { $sum: '$finalScore' } // <--- Changed from $avg to $sum
                }
            },

            // 4. Sort by Total Score (Highest to Lowest)
            {
                $sort: { totalScore: -1 }
            }
        ]);

        // 5. Find the index of the requested student
        const index = rankedList.findIndex(item => item._id.toString() === studentId);

        if (index === -1) {
            return res.status(200).json({ rank: '-' });
        }

        // 6. Return format "Rank / Total" (e.g., "5 / 30")
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
        return res.status(400).json({ message: 'Year and grade level are required' });
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
                    // Calculate the Grand Total of all subjects across both semesters
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