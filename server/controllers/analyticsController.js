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


// @desc    Get School-Wide Performance Matrix (Grouped by Grade Levels and Performance Buckets)
// @route   GET /api/analytics/overall-average-analysis
exports.getClassOverallAverageAnalysis = async (req, res) => {
    const { academicYear } = req.query;

    if (!academicYear) {
        return res.status(400).json({ message: "Academic Year is required." });
    }

    try {
        // ⚠️ 1. የሁሉም ተማሪዎች አጠቃላይ አማካይ ውጤት በየክፍላቸው በጅምላ መደብደብ [1, 2]
        const matrix = await Grade.aggregate([
            // ሀ. የአካዳሚክ አመቱን ፊልተር ማድረግ
            { $match: { academicYear: academicYear } },
            // ለ. የተማሪውን ሁሉንም የትምህርት ውጤቶች አማካይ መስራት
            {
                $group: {
                    _id: "$student",
                    overallAverage: { $avg: "$finalScore" }
                }
            },
            // ሐ. የተማሪውን ክፍል እና ፆታ መረጃ ማገናኘት
            {
                $lookup: {
                    from: "students",
                    localField: "_id",
                    foreignField: "_id",
                    as: "studentInfo"
                }
            },
            { $unwind: "$studentInfo" },
            // መ. ንቁ የሆኑትን ተማሪዎች ብቻ መለየት
            { $match: { "studentInfo.status": "Active" } },
            // ሠ. ሁሉንም ተማሪዎች በክፍላቸው (gradeLevel) ስር ግሩፕ ማድረግ
            {
                $group: {
                    _id: "$studentInfo.gradeLevel",
                    students: {
                        $push: {
                            gender: "$studentInfo.gender",
                            avg: "$overallAverage"
                        }
                    }
                }
            }
        ]);

        // ⚠️ 2. በደብተሩ ምስል ላይ ባሉት 5 ምድቦች መሠረት ወንድና ሴት ተማሪዎችን በየክፍሉ መመደብ [2]
        const formattedMatrix = matrix.map(row => {
            const gradeLevel = row._id;
            const stats = {
                gradeLevel,
                under50: { m: 0, f: 0 },
                between50And70: { m: 0, f: 0 },
                between70And80: { m: 0, f: 0 },
                between80And90: { m: 0, f: 0 },
                above90: { m: 0, f: 0 }
            };

            row.students.forEach(s => {
                const avg = s.avg;
                const isMale = s.gender === 'Male';
                
                if (avg < 50) {
                    if (isMale) stats.under50.m++; else stats.under50.f++;
                } else if (avg >= 50 && avg < 70) {
                    if (isMale) stats.between50And70.m++; else stats.between50And70.f++;
                } else if (avg >= 70 && avg < 80) {
                    if (isMale) stats.between70And80.m++; else stats.between70And80.f++;
                } else if (avg >= 80 && avg < 90) {
                    if (isMale) stats.between80And90.m++; else stats.between80And90.f++;
                } else if (avg >= 90) {
                    if (isMale) stats.above90.m++; else stats.above90.f++;
                }
            });

            return stats;
        });

        // ⚠️ 3. ክፍሎችን በቁጥር ቅደም ተከተል መደርደር (Grade 1 -> Grade 12)
        formattedMatrix.sort((a, b) => a.gradeLevel.localeCompare(b.gradeLevel, undefined, { numeric: true, sensitivity: 'base' }));

        res.status(200).json({
            success: true,
            academicYear,
            data: formattedMatrix
        });

    } catch (error) {
        console.error("School Matrix Aggregation Error:", error);
        res.status(500).json({ message: "Server error generating performance matrix." });
    }
};


// @desc    Get regional performance matrix grouped by base grade levels and subjects
// @route   GET /api/analytics/regional-performance
exports.getRegionalPerformanceMatrix = async (req, res) => {
    const { program, semester, academicYear } = req.query;

    console.log("Program Query Received:", program); // "Kg" ወይም "Grade"
    
    if (!program || !semester || !academicYear) {
        return res.status(400).json({ message: "Missing program, semester, or academicYear query parameters." });
    }

    try {
        // 1. በተመረጠው ፕሮግራም (Kg ወይም Grade) መሠረት የሚካተቱትን ክፍሎች መወሰን [2]
        let targetBaseGrades = [];
        const programLower = program.toLowerCase();

        if (programLower === 'kg') {
            targetBaseGrades = ['Kg 1', 'Kg 2', 'Kg 3', 'Nursery']; 
        } else if (programLower === 'grade') {
            targetBaseGrades = [
                'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
                'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
            ];
        } else {
            return res.status(400).json({ message: "Invalid program type. Must be 'Kg' or 'Grade'." });
        }

        // 2. በዳታቤዝ ውስጥ ያሉትን ሁሉንም ንቁ ተማሪዎች መፈለግ
        const students = await Student.find({ status: 'Active' }).select('_id gender gradeLevel').lean();

        const studentMap = new Map();
        const baseGradeStudentIdsMap = new Map();

        students.forEach(s => {
            const baseGrade = s.gradeLevel ? s.gradeLevel.replace(/[A-Z]$/i, '').trim() : '';
            
            if (targetBaseGrades.includes(baseGrade)) {
                studentMap.set(s._id.toString(), { gender: s.gender, baseGrade });
                if (!baseGradeStudentIdsMap.has(baseGrade)) {
                    baseGradeStudentIdsMap.set(baseGrade, []);
                }
                baseGradeStudentIdsMap.get(baseGrade).push(s._id);
            }
        });

        // 3. የትምህርቶችን ዝርዝር መጫን
        const allSubjects = await Subject.find({}).lean();
        const gradesReport = [];

        // ⚠️ 4. አንተ በሰጠኸኝ ትክክለኛ የትምህርት አሰላለፍ መሠረት የተዋቀረ የግርጌ ዝርዝር [2]
        const ALLOWED_SUBJECTS_BASE = [
            "አማርኛ",
            "ENGLISH",
            "ሒሳብ",
            "አካባቢ ሳይንስ",
            "ሳይንስ",
            "ግብረ ገብ",
            "የዜግነት",
            "ህብረተሰብ",
            "Affan Oromo",
            "ሥነ ጥበብ",
            "የሙያ ትምህርት",
            "ጤሰማ"
        ];

        for (const baseGrade of targetBaseGrades) {
            const studentIdsInBaseGrade = baseGradeStudentIdsMap.get(baseGrade) || [];
            
            const subjectsInGrade = allSubjects.filter(sub => {
                const subBase = sub.gradeLevel ? sub.gradeLevel.replace(/[A-Z]$/i, '').trim() : '';
                return subBase === baseGrade;
            });

            // ⚠️ 5. ICT ለ 7ኛ እና ለ 8ኛ ክፍል ብቻ መፈቀዱን ማረጋገጥ [2]
            const allowedForThisGrade = [...ALLOWED_SUBJECTS_BASE];
            if (baseGrade === 'Grade 7' || baseGrade === 'Grade 8') {
                allowedForThisGrade.push("ICT"); // 7 እና 8 ከሆነ ICT ይፈቀዳል [2]
            }

            // ⚠️ 6. የትምህርት ስሞችን ከተፈቀዱት ጋር ብቻ ማጣራት እና በታዘዘው ቅደም ተከተል መደርደር [2]
            const uniqueSubjectNames = [...new Set(subjectsInGrade.map(s => s.name))]
                .filter(name => allowedForThisGrade.some(allowed => allowed.toLowerCase().trim() === name.toLowerCase().trim()))
                .sort((a, b) => {
                    const idxA = allowedForThisGrade.findIndex(p => p.toLowerCase().trim() === a.toLowerCase().trim());
                    const idxB = allowedForThisGrade.findIndex(p => p.toLowerCase().trim() === b.toLowerCase().trim());
                    return idxA - idxB;
                });

            const subjectRows = [];

            for (const subName of uniqueSubjectNames) {
                const matchedSubjectIds = subjectsInGrade.filter(s => s.name === subName).map(s => s._id);

                const grades = await Grade.find({
                    subject: { $in: matchedSubjectIds },
                    student: { $in: studentIdsInBaseGrade },
                    semester,
                    academicYear
                }).lean();

                const stats = {
                    subject: subName,
                    enrolled: { m: 0, f: 0, t: 0 },
                    sitting: { m: 0, f: 0, t: 0 },
                    under50: { m: 0, f: 0, t: 0, pct: 0 },
                    between50And64: { m: 0, f: 0, t: 0, pct: 0 },
                    between65And79: { m: 0, f: 0, t: 0, pct: 0 },
                    between80And89: { m: 0, f: 0, t: 0, pct: 0 },
                    above90: { m: 0, f: 0, t: 0, pct: 0 }
                };

                studentIdsInBaseGrade.forEach(id => {
                    const s = studentMap.get(id.toString());
                    if (s) {
                        if (s.gender === 'Male') stats.enrolled.m++;
                        else if (s.gender === 'Female') stats.enrolled.f++;
                    }
                });
                stats.enrolled.t = stats.enrolled.m + stats.enrolled.f;

                grades.forEach(g => {
                    const studentDetails = studentMap.get(g.student.toString());
                    if (studentDetails && g.finalScore !== undefined && g.finalScore !== null) {
                        const isMale = studentDetails.gender === 'Male';
                        const score = g.finalScore;

                        if (isMale) stats.sitting.m++; else stats.sitting.f++;

                        if (score < 50) {
                            if (isMale) stats.under50.m++; else stats.under50.f++;
                        } else if (score >= 50 && score <= 64) {
                            if (isMale) stats.between50And64.m++; else stats.between50And64.f++;
                        } else if (score >= 65 && score <= 79) {
                            if (isMale) stats.between65And79.m++; else stats.between65And79.f++;
                        } else if (score >= 80 && score <= 89) {
                            if (isMale) stats.between80And89.m++; else stats.between80And89.f++;
                        } else if (score >= 90) {
                            if (isMale) stats.above90.m++; else stats.above90.f++;
                        }
                    }
                });

                stats.sitting.t = stats.sitting.m + stats.sitting.f;

                const totalSitting = stats.sitting.t;
                const updateBucket = (bucket) => {
                    bucket.t = bucket.m + bucket.f;
                    bucket.pct = totalSitting > 0 ? parseFloat(((bucket.t / totalSitting) * 100).toFixed(1)) : 0;
                };

                updateBucket(stats.under50);
                updateBucket(stats.between50And64);
                updateBucket(stats.between65And79);
                updateBucket(stats.between80And89);
                updateBucket(stats.above90);

                subjectRows.push(stats);
            }

            const gradeTotal = {
                subject: `${baseGrade} Total`,
                enrolled: { m: 0, f: 0, t: 0 },
                sitting: { m: 0, f: 0, t: 0 },
                under50: { m: 0, f: 0, t: 0, pct: 0 },
                between50And64: { m: 0, f: 0, t: 0, pct: 0 },
                between65And79: { m: 0, f: 0, t: 0, pct: 0 },
                between80And89: { m: 0, f: 0, t: 0, pct: 0 },
                above90: { m: 0, f: 0, t: 0, pct: 0 }
            };

            subjectRows.forEach(sub => {
                gradeTotal.enrolled.m += sub.enrolled.m;
                gradeTotal.enrolled.f += sub.enrolled.f;
                gradeTotal.enrolled.t += sub.enrolled.t;

                gradeTotal.sitting.m += sub.sitting.m;
                gradeTotal.sitting.f += sub.sitting.f;
                gradeTotal.sitting.t += sub.sitting.t;

                gradeTotal.under50.m += sub.under50.m;
                gradeTotal.under50.f += sub.under50.f;
                gradeTotal.under50.t += sub.under50.t;

                gradeTotal.between50And64.m += sub.between50And64.m;
                gradeTotal.between50And64.f += sub.between50And64.f;
                gradeTotal.between50And64.t += sub.between50And64.t;

                gradeTotal.between65And79.m += sub.between65And79.m;
                gradeTotal.between65And79.f += sub.between65And79.f;
                gradeTotal.between65And79.t += sub.between65And79.t;

                gradeTotal.between80And89.m += sub.between80And89.m;
                gradeTotal.between80And89.f += sub.between80And89.f;
                gradeTotal.between80And89.t += sub.between80And89.t;

                gradeTotal.above90.m += sub.above90.m;
                gradeTotal.above90.f += sub.above90.f;
                gradeTotal.above90.t += sub.above90.t;
            });

            const totalGradeSitting = gradeTotal.sitting.t;
            const updateGradeBucketPct = (bucket) => {
                bucket.pct = totalGradeSitting > 0 ? parseFloat(((bucket.t / totalGradeSitting) * 100).toFixed(1)) : 0;
            };

            updateGradeBucketPct(gradeTotal.under50);
            updateGradeBucketPct(gradeTotal.between50And64);
            updateGradeBucketPct(gradeTotal.between65And79);
            updateGradeBucketPct(gradeTotal.between80And89);
            updateGradeBucketPct(gradeTotal.above90);

            if (subjectRows.length > 0) {
                gradesReport.push({
                    gradeLevel: baseGrade,
                    subjects: subjectRows,
                    totalRow: gradeTotal
                });
            }
        }

        res.status(200).json({
            success: true,
            meta: { program, semester, academicYear },
            data: gradesReport
        });

    } catch (error) {
        console.error("Regional Performance Matrix Error:", error);
        res.status(500).json({ message: "Server error." });
    }
};