const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const AssessmentType = require('../models/AssessmentType');
const Subject = require('../models/Subject')
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

// @desc    Get Class Analysis (Gender, Ranges, Participation) for an Assessment Name across all Subjects
// @route   GET /api/grades/analysis/class-analytics
// @query   gradeLevel, assessmentName, semester, academicYear
exports.getClassAnalytics = async (req, res) => {
    const { gradeLevel, assessmentName, semester, academicYear } = req.query;

    if (!gradeLevel || !assessmentName || !semester || !academicYear) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {
        // 1. Fetch ALL Active Students in this Grade (to know Gender and Total Count)
        const students = await Student.find({ gradeLevel, status: 'Active' });
        
        // Create a fast lookup map for Student Gender: { "studentId": "Male", ... }
        const studentMap = {};
        let totalMalesInClass = 0;
        let totalFemalesInClass = 0;

        students.forEach(s => {
            studentMap[s._id.toString()] = s.gender;
            if (s.gender === 'Male') totalMalesInClass++;
            else totalFemalesInClass++;
        });

        const totalStudentsInClass = students.length;

        // 2. Find the Assessment Types (The Subjects) that match the name (e.g., "Test 1")
        const assessmentTypes = await AssessmentType.find({
            gradeLevel,
            name: { $regex: new RegExp(`^${assessmentName.trim()}$`, 'i') },
            semester,
            year: academicYear
        }).populate('subject', 'name');

        if (assessmentTypes.length === 0) {
            return res.status(404).json({ message: `No assessments found with name '${assessmentName}' for ${gradeLevel}.` });
        }

        // 3. Prepare the Analysis Array
        const analysisResults = [];

        // 4. Iterate through each Subject (AssessmentType)
        for (const type of assessmentTypes) {
            const subjectName = type.subject ? type.subject.name : "Unknown Subject";
            const totalMarks = type.totalMarks;

            // Fetch all grades for this specific assessment type
            const grades = await Grade.find({
                "assessments.assessmentType": type._id,
                student: { $in: students.map(s => s._id) } // Only active students
            });

            // Initialize Counters
            const stats = {
                subject: subjectName,
                totalMarks: totalMarks,
                students: {
                    total: totalStudentsInClass,
                    male: totalMalesInClass,
                    female: totalFemalesInClass
                },
                attended: { total: 0, male: 0, female: 0 },
                missed: { total: 0, male: 0, female: 0 },
                below50: { total: 0, male: 0, female: 0 }, // < 50%
                below75: { total: 0, male: 0, female: 0 }, // 50% - 74%
                below90: { total: 0, male: 0, female: 0 }, // 75% - 89%
                above90: { total: 0, male: 0, female: 0 }, // >= 90%
            };

            // Process Grades
            grades.forEach(gradeDoc => {
                // Find the specific score within the grade document
                const assessmentData = gradeDoc.assessments.find(a => 
                    a.assessmentType && a.assessmentType.toString() === type._id.toString()
                );

                const studentGender = studentMap[gradeDoc.student.toString()] || 'Male'; // Default to Male if unknown
                const genderKey = studentGender.toLowerCase(); // 'male' or 'female'

                // Check if student attended (score exists and is not null)
                if (assessmentData && assessmentData.score !== null && assessmentData.score !== undefined) {
                    const score = assessmentData.score;
                    const percentage = (score / totalMarks) * 100;

                    // Increment Attended
                    stats.attended.total++;
                    stats.attended[genderKey]++;

                    // Classify into ranges
                    if (percentage < 50) {
                        stats.below50.total++;
                        stats.below50[genderKey]++;
                    } else if (percentage < 75) {
                        stats.below75.total++;
                        stats.below75[genderKey]++;
                    } else if (percentage < 90) {
                        stats.below90.total++;
                        stats.below90[genderKey]++;
                    } else {
                        stats.above90.total++;
                        stats.above90[genderKey]++;
                    }
                }
            });

            // Calculate Missed (Total Class - Attended)
            stats.missed.total = stats.students.total - stats.attended.total;
            stats.missed.male = stats.students.male - stats.attended.male;
            stats.missed.female = stats.students.female - stats.attended.female;

            analysisResults.push(stats);
        }

        res.status(200).json({
            success: true,
            meta: {
                gradeLevel,
                assessmentName,
                semester,
                academicYear
            },
            data: analysisResults
        });

    } catch (error) {
        console.error("Class Analytics Error:", error);
        res.status(500).json({ message: "Server error generating analytics." });
    }
};

    
// backend/controllers/gradeController.js

exports.getSubjectPerformanceAnalysis = async (req, res) => {
    const { gradeLevel, semester, academicYear } = req.query;

    if (!gradeLevel || !semester || !academicYear) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {
        const subjects = await Subject.find({ gradeLevel }).sort({ name: 1 });
        const students = await Student.find({ gradeLevel, status: 'Active' }).select('_id');
        const studentIds = students.map(s => s._id);

        const analysis = [];

        for (const subject of subjects) {
            // 1. Calculate Total Possible Score
            const assessmentTypes = await AssessmentType.find({
                subject: subject._id,
                gradeLevel, semester
            });
            const totalPossible = assessmentTypes.reduce((sum, a) => sum + a.totalMarks, 0);

            // 2. Fetch Grades WITH Student Info (Gender)
            const grades = await Grade.find({
                subject: subject._id,
                student: { $in: studentIds },
                semester,
                academicYear
            }).populate('student', 'gender'); // <--- CRITICAL: Get Gender

            let totalScore = 0;
            let highest = 0;
            let lowest = totalPossible || 100;
            let passedCount = 0;
            let count = 0;

            // --- NEW: Complex Counters ---
            // Structure: { total: 0, male: 0, female: 0 }
            const initRange = () => ({ total: 0, m: 0, f: 0 });
            let ranges = {
                below50: initRange(),
                below75: initRange(),
                below90: initRange(),
                above90: initRange()
            };

            grades.forEach(g => {
                if (g.finalScore !== undefined && g.finalScore !== null && g.student) {
                    const score = g.finalScore;
                    const gender = g.student.gender; // Assuming 'Male' or 'Female'
                    const isMale = gender === 'Male' || gender === 'M';

                    totalScore += score;
                    if (score > highest) highest = score;
                    if (score < lowest) lowest = score;
                    
                    const passMark = totalPossible / 2;
                    if (score >= passMark) passedCount++;
                    count++;

                    // Calculate Percentage relative to Total Marks
                    const percentage = totalPossible > 0 ? (score / totalPossible) * 100 : 0;

                    // Helper to increment correct bucket
                    const increment = (bucket) => {
                        bucket.total++;
                        if (isMale) bucket.m++; else bucket.f++;
                    };

                    if (percentage < 50) increment(ranges.below50);
                    else if (percentage < 75) increment(ranges.below75);
                    else if (percentage < 90) increment(ranges.below90);
                    else increment(ranges.above90);
                }
            });

            if (count === 0) lowest = 0;
            const avg = count > 0 ? (totalScore / count).toFixed(2) : 0;
            const passRate = count > 0 ? ((passedCount / count) * 100).toFixed(1) : 0;

            analysis.push({
                subjectName: subject.name,
                submittedGrades: count,
                averageScore: avg,
                highestScore: highest,
                lowestScore: lowest,
                passRate: passRate + '%',
                ranges: ranges, // Now contains m/f breakdown
                totalPossibleScore: totalPossible
            });
        }

        analysis.sort((a, b) => b.averageScore - a.averageScore);

        res.status(200).json({ success: true, data: analysis });

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ message: "Server error." });
    }
};
