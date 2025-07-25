// backend/controllers/rankController.js
const Grade = require('../models/Grade');
const mongoose = require('mongoose');

// @desc    Calculate a student's rank in their class for a semester
// @route   GET /api/ranks/class-rank/:studentId?academicYear=...&semester=...
exports.getStudentRank = async (req, res) => {
    const { studentId } = req.params;
    const { academicYear, semester, gradeLevel } = req.query;

    if (!academicYear || !semester || !gradeLevel) {
        return res.status(400).json({ message: 'Year, semester, and grade level are required' });
    }

    try {
        // This is a powerful MongoDB Aggregation Pipeline
        const rankedList = await Grade.aggregate([
            // Stage 1: Match only the grades for the specific year, semester, and grade level
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
                    academicYear: academicYear,
                    semester: semester
                }
            },
            // Stage 2: Group grades by student and calculate their average score
            {
                $group: {
                    _id: '$student', // Group by student ID
                    averageScore: { $avg: '$finalScore' }
                }
            },
            // Stage 3: Sort the entire class by average score, descending
            {
                $sort: { averageScore: -1 }
            }
        ]);

        // Stage 4: Find the index (position) of our target student in the sorted list
        const studentRank = rankedList.findIndex(
            item => item._id.toString() === studentId
        );

        if (studentRank === -1) {
            // This means the student has no grades for this semester
            return res.status(200).json({ rank: 'N/A' });
        }

        // The rank is the index + 1
        res.status(200).json({ rank: studentRank + 1 });

    } catch (error) {
        console.error('Error calculating rank:', error);
        res.status(500).json({ message: 'Server error while calculating rank' });
    }
};


// @desc    Calculate a student's overall rank for the year
// @route   GET /api/ranks/overall-rank/:studentId?academicYear=...&gradeLevel=...
exports.getOverallRank = async (req, res) => {
    const { studentId } = req.params;
    const { academicYear, gradeLevel } = req.query;

    if (!academicYear || !gradeLevel) {
        return res.status(400).json({ message: 'Year and grade level are required' });
    }

    try {
        const rankedList = await Grade.aggregate([
            // Stage 1: Match grades for the specific year and grade level (both semesters)
            {
                $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' }
            },
            { $unwind: '$studentInfo' },
            {
                $match: {
                    'studentInfo.gradeLevel': gradeLevel,
                    academicYear: academicYear,
                }
            },
            // Stage 2: Group by student and calculate their OVERALL average from all subjects/semesters
            {
                $group: {
                    _id: '$student', // Group by student
                    // This calculates the average of ALL finalScores for that student in the matched year
                    overallAverage: { $avg: '$finalScore' } 
                }
            },
            // Stage 3: Sort by the calculated overall average
            {
                $sort: { overallAverage: -1 }
            }
        ]);

        // Stage 4: Find the student's position in the sorted list
        const studentRank = rankedList.findIndex(
            item => item._id.toString() === studentId
        );

        if (studentRank === -1) {
            return res.status(200).json({ rank: 'N/A' });
        }

        res.status(200).json({ rank: studentRank + 1 });

    } catch (error) {
        console.error('Error calculating overall rank:', error);
        res.status(500).json({ message: 'Server error while calculating rank' });
    }
};