// backend/controllers/analyticsController.js
const Grade = require('../models/Grade');
const AssessmentType = require('../models/AssessmentType');
const mongoose = require('mongoose');

// @desc    Get detailed crosstab analysis for a specific assessment type
// @route   GET /api/analytics/assessment?assessmentTypeId=...
exports.getAssessmentAnalysis = async (req, res) => {
    const { assessmentTypeId } = req.query;
    if (!assessmentTypeId) {
        return res.status(400).json({ message: 'Assessment Type ID is required.' });
    }

    try {
        const assessmentType = await AssessmentType.findById(assessmentTypeId);
        if (!assessmentType) {
            return res.status(404).json({ message: 'Assessment Type not found.' });
        }
        
        // The definitive aggregation pipeline with score normalization
        const analysis = await Grade.aggregate([
            { $unwind: '$assessments' },
            { $match: { 'assessments.assessmentType': new mongoose.Types.ObjectId(assessmentTypeId) } },
            {
                $addFields: {
                    "normalizedScore": {
                        $multiply: [ { $divide: ["$assessments.score", assessmentType.totalMarks] }, 100 ]
                    }
                }
            },
            { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
            { $unwind: '$studentInfo' },
            {
                $facet: {
                    "overallStats": [
                        { $group: {
                            _id: null,
                            averageScore: { $avg: '$normalizedScore' },
                            maxScore: { $max: '$normalizedScore' },
                            minScore: { $min: '$normalizedScore' },
                            studentCount: { $sum: 1 }
                        }}
                    ],
                    "distribution": [
                        { $bucket: {
                            groupBy: "$normalizedScore", 
                            boundaries: [0, 50, 75, 90, 101],
                            default: "Other",
                            output: { "count": { $sum: 1 }, "genders": { $push: "$studentInfo.gender" } }
                        }}
                    ],
                    "allScores": [
                        { $sort: { 'normalizedScore': -1 } },
                        { $project: { _id: 0, studentName: '$studentInfo.fullName', originalScore: '$assessments.score', percentageScore: '$normalizedScore' } }
                    ]
                }
            }
        ]);
        
        // Safety check for empty results
        if (!analysis || analysis.length === 0 || analysis[0].overallStats.length === 0) {
            return res.status(200).json({ 
                message: 'No scores have been entered for this assessment yet.',
                assessmentType,
                analysis: null
            });
        }
        
        // --- THIS IS THE DEFINITIVE PROCESSING LOGIC FOR THE CROSSTAB REPORT ---
        const totalStudents = analysis[0].overallStats[0].studentCount;
        const buckets = analysis[0].distribution;

        // Helper function to process each bucket
        const getBucketData = (rangeId) => {
            const bucket = buckets.find(b => b._id === rangeId);
            if (!bucket) return { F: 0, M: 0, T: 0, P: '0.0' }; // Default empty data
            
            const femaleCount = bucket.genders.filter(g => g === 'Female').length;
            const maleCount = bucket.genders.filter(g => g === 'Male').length;
            const totalCount = bucket.count;
            const percentage = totalStudents > 0 ? (totalCount / totalStudents) * 100 : 0;
            
            return {
                F: femaleCount,
                M: maleCount,
                T: totalCount,
                P: percentage.toFixed(1)
            };
        };

        // Create the final distribution object in the exact format the frontend needs
        const processedDistribution = {
            under50: getBucketData(0),
            between50and75: getBucketData(50),
            between75and90: getBucketData(75),
            over90: getBucketData(90)
        };
        
        // Calculate the overall total Male/Female counts for the first column
        const allGenders = buckets.flatMap(b => b.genders);
        const totalFemale = allGenders.filter(g => g === 'Female').length;
        const totalMale = allGenders.filter(g => g === 'Male').length;

        // Combine all results into one clean object to send to the frontend
        const finalAnalysis = {
            stats: analysis[0].overallStats[0],
            distribution: processedDistribution, // The new crosstab-ready object
            scores: analysis[0].allScores,
            totalCounts: {
                F: totalFemale,
                M: totalMale,
                T: totalStudents
            }
        };

        res.status(200).json({ assessmentType, analysis: finalAnalysis });

    } catch (error) {
        console.error("Error in assessment analysis:", error);
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};