const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const AssessmentType = require('../models/AssessmentType');

// Controller to get assessment analysis

exports.getAssessmentAnalysis = async (req, res) => {
  const { selectedAssessment} = req.query;
  const gradeLevel = req.query.selectedGrade;

  if (!selectedAssessment) {
    return res.status(400).json({ message: 'Assessment Type ID is required.' });
  }
  if (!gradeLevel) {
    return res.status(400).json({ message: 'Grade Level is required to get class-level analytics.' });
  }

  try {
    const assessmentType = await AssessmentType.findById(selectedAssessment);
    if (!assessmentType) return res.status(404).json({ message: 'Assessment Type not found.' });

    // 1️⃣ Get all students in the class
    const allStudents = await Student.find({ gradeLevel });
    const studentIds = allStudents.map(s => s._id);
    const totalStudents = allStudents.length;

    // 2️⃣ Get grades for those students for this assessment
    const analysis = await Grade.aggregate([
      { $unwind: '$assessments' },
      { $match: {
          'assessments.assessmentType': new mongoose.Types.ObjectId(selectedAssessment),
          student: { $in: studentIds }
      }},
      { $addFields: {
          normalizedScore: { $multiply: [{ $divide: ['$assessments.score', assessmentType.totalMarks] }, 100] }
      }},
      { $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
      }},
      { $unwind: '$studentInfo' },
      { $project: {
          _id: 0,
          studentName: '$studentInfo.fullName',
          gender: '$studentInfo.gender',
          score: '$assessments.score',
          normalizedScore: 1
      }}
    ]);

    if (!analysis.length) {
      return res.status(200).json({ message: 'No students have taken this assessment yet.', assessmentType, analysis: null });
    }

    // 3️⃣ Participation info
    const studentsWhoTookAssessment = analysis.length;
    const studentsWhoMissedAssessment = totalStudents - studentsWhoTookAssessment;
    const maleStudents = analysis.filter(s => s.gender === 'Male').length;
    const femaleStudents = analysis.filter(s => s.gender === 'Female').length;

    // 4️⃣ Score stats
    const scores = analysis.map(s => s.score);
    const normalizedScores = analysis.map(s => s.normalizedScore);

    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);

    const highestPercent = Math.max(...normalizedScores).toFixed(2);
    const lowestPercent = Math.min(...normalizedScores).toFixed(2);
    const averagePercent = (normalizedScores.reduce((a,b)=>a+b,0)/normalizedScores.length).toFixed(2);

    const passCount = normalizedScores.filter(s => s >= 50).length;
    const failCount = normalizedScores.filter(s => s < 50).length;
    const passPercentage = ((passCount / studentsWhoTookAssessment) * 100).toFixed(1);
    const failPercentage = ((failCount / studentsWhoTookAssessment) * 100).toFixed(1);

    // 5️⃣ Distribution buckets
    const buckets = [
      { label: 'under50', min: 0, max: 50 },
      { label: 'between50and75', min: 50, max: 75 },
      { label: 'between75and90', min: 75, max: 90 },
      { label: 'over90', min: 90, max: 101 }
    ];

    const processedDistribution = {};
    for (const { label, min, max } of buckets) {
      const group = analysis.filter(a => a.normalizedScore >= min && a.normalizedScore < max);
      const femaleCount = group.filter(s => s.gender === 'Female').length;
      const maleCount = group.filter(s => s.gender === 'Male').length;
      const totalCount = group.length;
      const percentage = studentsWhoTookAssessment > 0 ? (totalCount / studentsWhoTookAssessment) * 100 : 0;

      processedDistribution[label] = {
        F: femaleCount,
        M: maleCount,
        T: totalCount,
        P: percentage.toFixed(1)
      };
    }

    const finalAnalysis = {
      general: {
        totalStudents,
        studentsWhoTookAssessment,
        studentsWhoMissedAssessment,
        maleStudents,
        femaleStudents
      },
      scoreStats: {
        highestScore,
        lowestScore,
        averageScore,
        highestPercent,
        lowestPercent,
        averagePercent,
        passCount,
        failCount,
        passPercentage,
        failPercentage
      },
      distribution: processedDistribution,
      scores: analysis
    };

    res.status(200).json({ assessmentType, analysis: finalAnalysis });
  } catch (err) {
    console.error('Error in assessment analysis:', err);
    res.status(500).json({ message: 'Server Error', details: err.message });
  }
};

