const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const AssessmentType = require('../models/AssessmentType');
const Subject = require('../models/Subject')
const AssessmentName = require('../models/AssessmentName');

exports.getAssessmentAnalysis = async (req, res) => {
  const { selectedAssessment } = req.query;
  const gradeLevel = req.query.selectedGrade;

  if (!selectedAssessment || !gradeLevel) {
    return res.status(400).json({ message: 'Missing selectedAssessment or selectedGrade.' });
  }

  try {
    const assessmentType = await AssessmentType.findById(selectedAssessment);
    if (!assessmentType) return res.status(404).json({ message: 'Assessment Type not found.' });

    const allStudents = await Student.find({ gradeLevel });
    const studentIds = allStudents.map(s => s._id);

    const analysis = await Grade.aggregate([
      // ⚠️ ማስተካከያ 1፦ ዩኒዊንድ ከመደረጉ በፊት መጀመሪያ ፊልተር በማድረግ ዳታቤዝ እንዳይጨናነቅ መከላከል [1]
      { $match: {
          student: { $in: studentIds },
          'assessments.assessmentType': new mongoose.Types.ObjectId(selectedAssessment)
      }},
      { $unwind: '$assessments' },
      // ዩኒዊንድ ከተደረገ በኋላ የዚህን ፈተና ውጤት ብቻ ማጣራት
      { $match: {
          'assessments.assessmentType': new mongoose.Types.ObjectId(selectedAssessment)
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

    const studentsWhoTookAssessment = analysis.length;
    const studentsWhoMissedAssessment = allStudents.length - studentsWhoTookAssessment;
    const maleStudents = analysis.filter(s => s.gender === 'Male').length;
    const femaleStudents = analysis.filter(s => s.gender === 'Female').length;

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

    const buckets = [
      { label: 'under50', min: 0, max: 50 },
      { label: 'between50and75', min: 50, max: 75 },
      { label: 'between75and90', min: 75, max: 90 },
      { label: 'over90', min: 90, max: 101 }
    ];

    const processedDistribution = {};
    for (const { label, min, max } of buckets) {
      const group = analysis.filter(a => a.normalizedScore >= min && a.normalizedScore < max);
      processedDistribution[label] = {
        F: group.filter(s => s.gender === 'Female').length,
        M: group.filter(s => s.gender === 'Male').length,
        T: group.length,
        P: studentsWhoTookAssessment > 0 ? ((group.length / studentsWhoTookAssessment) * 100).toFixed(1) : '0.0'
      };
    }

    res.status(200).json({
      assessmentType,
      analysis: {
        general: { totalStudents: allStudents.length, studentsWhoTookAssessment, studentsWhoMissedAssessment, maleStudents, femaleStudents },
        scoreStats: { highestScore, lowestScore, averageScore, highestPercent, lowestPercent, averagePercent, passCount, failCount, passPercentage, failPercentage },
        distribution: processedDistribution,
        scores: analysis
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get Class Analysis for an Assessment Name across all Subjects
// @route   GET /api/grades/analysis/class-analytics
exports.getClassAnalytics = async (req, res) => {
    const { gradeLevel, assessmentName, semester, academicYear } = req.query;

    if (!gradeLevel || !assessmentName || !semester || !academicYear) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {
        // 1. የክፍሉን ንቁ ተማሪዎች መፈለግ
        const students = await Student.find({ gradeLevel, status: 'Active' });
        const studentIds = students.map(s => s._id);
        
        const studentMap = {};
        let totalMalesInClass = 0;
        let totalFemalesInClass = 0;

        students.forEach(s => {
            studentMap[s._id.toString()] = s.gender;
            if (s.gender === 'Male') totalMalesInClass++;
            else totalFemalesInClass++;
        });

        // 2. የፈተና መታወቂያዎችን (nameIds) መፈለግ
        const matchingNames = await AssessmentName.find({
            name: { $regex: new RegExp(`^${assessmentName.trim()}$`, 'i') }
        }).select('_id');
        const nameIds = matchingNames.map(n => n._id);
        const nameStrings = matchingNames.map(n => n._id.toString());

        const assessmentTypes = await AssessmentType.find({
            gradeLevel,
            name: { $in: [...nameIds, ...nameStrings] },
            semester,
            year: academicYear
        }).populate('subject', 'name');

        if (assessmentTypes.length === 0) {
            return res.status(404).json({ message: `No assessments found with name '${assessmentName}' for ${gradeLevel}.` });
        }

        const matchedTypeIds = assessmentTypes.map(t => t._id);
        const allGrades = await Grade.find({
            "assessments.assessmentType": { $in: matchedTypeIds },
            student: { $in: studentIds }
        });

        const analysisResults = [];

        for (const type of assessmentTypes) {
            const subjectName = type.subject ? type.subject.name : "Unknown Subject";
            const totalMarks = type.totalMarks;

            const grades = allGrades.filter(g => 
                g.assessments.some(a => a.assessmentType && a.assessmentType.toString() === type._id.toString())
            );

            const stats = {
                subject: subjectName,
                totalMarks: totalMarks,
                students: { total: students.length, male: totalMalesInClass, female: totalFemalesInClass },
                attended: { total: 0, male: 0, female: 0 },
                missed: { total: 0, male: 0, female: 0 },
                below50: { total: 0, male: 0, female: 0 },
                below75: { total: 0, male: 0, female: 0 },
                below90: { total: 0, male: 0, female: 0 },
                above90: { total: 0, male: 0, female: 0 },
            };

            grades.forEach(gradeDoc => {
                const assessmentData = gradeDoc.assessments.find(a => 
                    a.assessmentType && a.assessmentType.toString() === type._id.toString()
                );

                const studentGender = studentMap[gradeDoc.student.toString()] || 'Male';
                const genderKey = studentGender.toLowerCase();

                if (assessmentData && assessmentData.score !== null && assessmentData.score !== undefined) {
                    const score = assessmentData.score;
                    const percentage = (score / totalMarks) * 100;

                    stats.attended.total++;
                    stats.attended[genderKey]++;

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

            stats.missed.total = stats.students.total - stats.attended.total;
            stats.missed.male = stats.students.male - stats.attended.male;
            stats.missed.female = stats.students.female - stats.attended.female;

            analysisResults.push(stats);
        }

        res.status(200).json({ success: true, meta: { gradeLevel, assessmentName, semester, academicYear }, data: analysisResults });

    } catch (error) {
        console.error("Class Analytics Error:", error);
        res.status(500).json({ message: "Server error generating analytics." });
    }
};
    
// @desc    Get Subject Performance Analysis (Optimized Bulk Query)
exports.getSubjectPerformanceAnalysis = async (req, res) => {
    const { gradeLevel, semester, academicYear } = req.query;

    if (!gradeLevel || !semester || !academicYear) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {
        const subjects = await Subject.find({ gradeLevel }).sort({ name: 1 });
        const students = await Student.find({ gradeLevel, status: 'Active' }).select('_id');
        const studentIds = students.map(s => s._id);

        // ⚠️ ማስተካከያ 3፦ ሁሉንም የክፍሉን ፈተናዎች እና ውጤቶች ከሉፕ ውጪ በ2 የጅምላ ኳየሪዎች ብቻ መጫን (የ24 ኳየሪ ጫናን ያስቀራል!) [1, 2]
        const allAssessmentTypes = await AssessmentType.find({ gradeLevel, semester });
        const allGrades = await Grade.find({
            student: { $in: studentIds },
            semester,
            academicYear
        }).populate('student', 'gender');

        const analysis = [];

        for (const subject of subjects) {
            // በጃቫስክሪፕት ሜሞሪ ላይ ከዝርዝሩ ውስጥ የዚህን ትምህርት ፈተናዎች እና ውጤቶች መለየት [2]
            const subjectAssessments = allAssessmentTypes.filter(a => a.subject.toString() === subject._id.toString());
            const totalPossible = subjectAssessments.reduce((sum, a) => sum + a.totalMarks, 0);

            const subjectGrades = allGrades.filter(g => g.subject.toString() === subject._id.toString());

            let totalScore = 0;
            let highest = 0;
            let lowest = totalPossible || 100;
            let passedCount = 0;
            let count = 0;

            const initRange = () => ({ total: 0, m: 0, f: 0 });
            let ranges = { below50: initRange(), below75: initRange(), below90: initRange(), above90: initRange() };

            subjectGrades.forEach(g => {
                if (g.finalScore !== undefined && g.finalScore !== null && g.student) {
                    const score = g.finalScore;
                    const gender = g.student.gender;
                    const isMale = gender === 'Male' || gender === 'M';

                    totalScore += score;
                    if (score > highest) highest = score;
                    if (score < lowest) lowest = score;
                    
                    const passMark = totalPossible / 2;
                    if (score >= passMark) passedCount++;
                    count++;

                    const percentage = totalPossible > 0 ? (score / totalPossible) * 100 : 0;

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
                ranges: ranges,
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

// @desc    Get students scoring below 60% per subject
// @route   GET /api/grades/analysis/at-risk
exports.getAtRiskStudents = async (req, res) => {
    const { gradeLevel, semester, academicYear } = req.query;

    if (!gradeLevel || !semester || !academicYear) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {
        const subjects = await Subject.find({ gradeLevel }).sort({ name: 1 });
        const students = await Student.find({ gradeLevel, status: 'Active' }).select('_id fullName studentId');
        const studentIds = students.map(s => s._id);

        const report = [];

        for (const subject of subjects) {
            // 1. Calculate Total Marks for this Subject
            const assessmentTypes = await AssessmentType.find({
                subject: subject._id, gradeLevel, semester
            });
            const totalPossible = assessmentTypes.reduce((sum, a) => sum + a.totalMarks, 0);

            if (totalPossible === 0) continue; // Skip if no assessments defined

            // 2. Define the Cutoff (60%)
            const cutoffScore = totalPossible * 0.6;

            // 3. Find Grades below cutoff
            const lowGrades = await Grade.find({
                subject: subject._id,
                student: { $in: studentIds },
                semester,
                academicYear,
                finalScore: { $lt: cutoffScore } // Less than 60%
            }).populate('student', 'fullName studentId gender');

            if (lowGrades.length > 0) {
                report.push({
                    subjectName: subject.name,
                    totalPossible: totalPossible,
                    cutoff: cutoffScore,
                    students: lowGrades.map(g => ({
                        id: g.student._id,
                        name: g.student.fullName,
                        studentId: g.student.studentId,
                        gender: g.student.gender,
                        score: g.finalScore,
                        percentage: ((g.finalScore / totalPossible) * 100).toFixed(1)
                    })).sort((a, b) => a.score - b.score) // Sort lowest score first
                });
            }
        }

        res.status(200).json({ success: true, data: report });

    } catch (error) {
        console.error("At Risk Error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// @route   GET /api/analytics/retention
exports.getYearlyEnrollmentAnalytics = async (req, res) => {
    const { targetYear } = req.query; // ለምሳሌ: "2018" ወይም "2019"

    if (!targetYear) {
        return res.status(400).json({ message: 'Target year is required.' });
    }

    try {
        const prevYear = String(Number(targetYear) - 1);

        const totalEnrolled = await Student.countDocuments({ year: targetYear, status: 'Active' });

        const newStudents = await Student.countDocuments({
            year: targetYear,
            status: 'Active',
            $or: [
                { academicHistory: { $size: 0 } },
                { academicHistory: { $exists: false } }
            ]
        });

        const returningStudents = await Student.countDocuments({
            year: targetYear,
            status: 'Active',
            academicHistory: { $not: { $size: 0 } } 
        });

        const stayedFromPrevYear = await Student.countDocuments({
            year: targetYear,
            "academicHistory.year": prevYear
        });

        const droppedOutPrevYear = await Student.countDocuments({
            $or: [
                { year: prevYear, status: { $in: ["Withdrawn", "Changed"] } },
                { academicHistory: { $elemMatch: { year: prevYear, statusAtEnd: { $in: ["Withdrawn", "Changed"] } } } }
            ]
        });

        res.status(200).json({
            success: true,
            year: targetYear,
            stats: {
                totalEnrolled,
                newStudents,
                returningStudents,
                retainedFromPrevYear: stayedFromPrevYear,
                droppedOutFromPrevYear: droppedOutPrevYear,
                retentionRate: (stayedFromPrevYear + droppedOutPrevYear) > 0 
                    ? parseFloat(((stayedFromPrevYear / (stayedFromPrevYear + droppedOutPrevYear)) * 100).toFixed(1)) 
                    : 100
            }
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: 'Server error generating enrollment analytics' });
    }
};