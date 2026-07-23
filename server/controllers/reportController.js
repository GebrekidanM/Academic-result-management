// server/controllers/reportCardController.js
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const BehavioralReport = require('../models/BehavioralReport');
const SupportiveGrade = require('../models/SupportiveGrade');
const calculateAge = require("../utils/calculateAge");
const Subject = require("../models/Subject");
const mongoose = require('mongoose');

// Dynamically calculate current Ethiopian Calendar (EC) Year
const getEthiopianYear = (gregorianDate = new Date()) => {
    const year = gregorianDate.getFullYear();
    const month = gregorianDate.getMonth(); // 0-indexed (8 is September)
    const day = gregorianDate.getDate();

    let ethiopianYear = year - 8;
    if (month > 8 || (month === 8 && day >= 11)) {
        ethiopianYear = year - 7;
    }
    return ethiopianYear;
};

/**
 * HELPER 1: CLEAN & MERGE ACADEMIC GRADES (Numeric)
 * - Filters by current grade level.
 * - Merges duplicate subjects.
 * - Deduplicates assessments.
 */
const mergeDuplicateGrades = (rawGrades, targetGradeLevel) => {
    // 1. Strict Filter: Only keep subjects for the active or historical Grade Level [1]
    const filteredGrades = rawGrades.filter(g => 
        g.subject && g.subject.gradeLevel === targetGradeLevel
    );

    const gradeMap = new Map();

    filteredGrades.forEach(grade => {
        const cleanAssessments = (grade.assessments || []).filter(a => a.assessmentType != null);
        const key = `${grade.semester}-${grade.subject.name.trim().toLowerCase()}`;

        if (gradeMap.has(key)) {
            const existing = gradeMap.get(key);
            
            if (!existing.academicYear && grade.academicYear) {
                existing.academicYear = grade.academicYear;
            }

            const assessmentMap = new Map();
            existing.assessments.forEach(a => assessmentMap.set(a.assessmentType._id.toString(), a));
            
            cleanAssessments.forEach(a => {
                const id = a.assessmentType._id.toString();
                if (!assessmentMap.has(id)) assessmentMap.set(id, a);
            });

            existing.assessments = Array.from(assessmentMap.values());
            existing.finalScore = existing.assessments.reduce((sum, a) => sum + (a.score || 0), 0);

        } else {
            const newEntry = grade.toObject ? grade.toObject() : { ...grade };
            newEntry.assessments = cleanAssessments;
            gradeMap.set(key, newEntry);
        }
    });

    return Array.from(gradeMap.values());
};

/**
 * HELPER 2: PROCESS SUPPORTIVE GRADES (Letters: A, B, C)
 */
const processSupportiveGrades = (supportiveDocs) => {
    const map = new Map();

    supportiveDocs.forEach(doc => {
        const subjectName = doc.subject?.name || "Unknown";
        
        if (!map.has(subjectName)) {
            map.set(subjectName, { name: subjectName, sem1: '-', sem2: '-' });
        }

        const entry = map.get(subjectName);
        if (doc.semester === 'First Semester') entry.sem1 = doc.score;
        else if (doc.semester === 'Second Semester') entry.sem2 = doc.score;
    });

    return Array.from(map.values());
};

/**
 * HELPER 3: CALCULATE STATS
 */
const calculateStats = (cleanedGrades, semesterName) => {
    const semesterGrades = cleanedGrades.filter(g => g.semester === semesterName);
    if (semesterGrades.length === 0) return { sum: 0, avg: 0 };

    const totalScore = semesterGrades.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
    const average = totalScore / semesterGrades.length;

    return { 
        sum: parseFloat(totalScore.toFixed(2)), 
        avg: parseFloat(average.toFixed(2)) 
    };
};

/**
 * HELPER 4: PROCESS BEHAVIOR TRAITS
 */
const processBehaviorData = (behaviorDocs) => {
  const sem1 = behaviorDocs.find(b => b.semester === 'First Semester');
  const sem2 = behaviorDocs.find(b => b.semester === 'Second Semester');

  const standardTraits = [
      "Punctuality", "Responsibility",
      "Communication book usage", "T-book & E-book condition", "Personal hygiene", 
      "Proper dressing of school uniform", "Following school rules and regulation", "Communication skill",
      "Participating in class", "English language usage"
  ];

  const progressMap = standardTraits.map(trait => {
    const s1Result = sem1?.evaluations?.find(e => e.area === trait)?.result || '-';
    const s2Result = sem2?.evaluations?.find(e => e.area === trait)?.result || '-';
    
    return { area: trait, sem1: s1Result, sem2: s2Result };
  });

  return {
    progress: progressMap,
    teacherComments: {
      sem1: sem1?.teacherComment || '',
      sem2: sem2?.teacherComment || ''
    }
  };
};

/**
 * HELPER 5: EXTRACT CONDUCT & ABSENT
 */
const processAttendanceAndConduct = (behaviorDocs) => {
    const sem1 = behaviorDocs.find(b => b.semester === 'First Semester');
    const sem2 = behaviorDocs.find(b => b.semester === 'Second Semester');

    return {
        sem1: {
            conduct: sem1?.conduct || '-',
            absent: sem1?.absent || sem1?.evaluations?.find(e => e.area === 'Absent')?.result || '-'
        },
        sem2: {
            conduct: sem2?.conduct || '-',
            absent: sem2?.absent || sem2?.evaluations?.find(e => e.area === 'Absent')?.result || '-'
        }
    };
};

/**
 * MAIN CONTROLLER
 * @route GET /api/reports/student/:studentId?academicYear=2018
 */
exports.generateStudentReport = async (req, res) => {
  try {
    const targetStudentId = req.params.studentId || req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetStudentId)) {
        return res.status(400).json({ message: 'Invalid Student ID format.' });
    }

    // 1. Find Student
    const student = await Student.findById(targetStudentId);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    // Determine target year (Defaults to student's current active year) [1]
    const targetYear = req.query.academicYear || student.year || getEthiopianYear().toString();

    // Determine what grade level they were in during that target year [1]
    let targetGradeLevel = student.gradeLevel;
    if (targetYear !== student.year && Array.isArray(student.academicHistory)) {
        const historicalRecord = student.academicHistory.find(h => h.year === targetYear);
        if (historicalRecord) {
            targetGradeLevel = historicalRecord.gradeAtThatTime;
        }
    }

    // 2. Fetch Raw Data Filtered by Student & Year in Parallel
    const [rawGrades, behaviorDocs, rawSupportive] = await Promise.all([
        Grade.find({ student: student._id, academicYear: targetYear }).populate('subject', 'name gradeLevel').populate('assessments.assessmentType', 'name totalMarks month').lean(),
        BehavioralReport.find({ student: student._id, academicYear: targetYear }),
        SupportiveGrade.find({ student: student._id, academicYear: targetYear }).populate('subject', 'name').lean()
    ]);

    // 3. Process Academic Grades (using correct active/historical grade level) [1]
    const cleanedGrades = mergeDuplicateGrades(rawGrades, targetGradeLevel);

    // 4. Calculate Stats (Academic Only)
    const statsSem1 = calculateStats(cleanedGrades, 'First Semester');
    const statsSem2 = calculateStats(cleanedGrades, 'Second Semester');

    let studentFinalAvg = 0;
    if (statsSem1.avg > 0 && statsSem2.avg > 0) studentFinalAvg = (statsSem1.avg + statsSem2.avg) / 2;
    else studentFinalAvg = statsSem1.avg + statsSem2.avg;

    // 5. Process Supportive Grades (Letters)
    const supportiveData = processSupportiveGrades(rawSupportive);

    // 6. Promotion Logic (using correct class level for that year) [1]
    const gradeNumMatch = targetGradeLevel.match(/\d+/);
    const nextGrade = gradeNumMatch ? parseInt(gradeNumMatch[0]) + 1 : null;
    const promotedStr = nextGrade ? `Grade ${nextGrade}` : 'Next Level';

    // 7. Assemble Response
    const finalReport = {
      studentInfo: {
        fullName: student.fullName,
        studentId: student.studentId,
        sex: student.gender,
        age: calculateAge(student.dateOfBirth),
        classId: targetGradeLevel, // Standardized to show class they took *that* year
        academicYear: targetYear,
        photoUrl: student.imageUrl,
        promotedTo: studentFinalAvg >= 50 ? promotedStr : 'Retained',
      },
      semester1: statsSem1,
      semester2: statsSem2,
      finalAverage: parseFloat(studentFinalAvg.toFixed(2)),
      grades: cleanedGrades, 
      supportiveGrades: supportiveData, 
      behavior: processBehaviorData(behaviorDocs),
      footerData: processAttendanceAndConduct(behaviorDocs),
      rank: null 
    };

    res.status(200).json(finalReport);

  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: 'Server error generating report' });
  }
};


// @desc    Generate class reports in batch
// @route   GET /api/reports/class/:gradeLevel?academicYear=2018
exports.generateClassReports = async (req, res) => {
    try {
        const { gradeLevel } = req.params;
        const academicYear = req.query.academicYear || getEthiopianYear().toString(); 

        // 1. ALIGNED: Find all students who took this gradeLevel during the targeted year [1]
        const studentQuery = {
            $or: [
                { year: academicYear, gradeLevel: gradeLevel },
                {
                    academicHistory: {
                        $elemMatch: {
                            year: academicYear,
                            gradeAtThatTime: gradeLevel
                        }
                    }
                }
            ]
        };

        const students = await Student.find(studentQuery).sort({ fullName: 1 });

        if (!students.length) {
            return res.status(404).json({ message: `No students found for class ${gradeLevel} in academic year ${academicYear}.` });
        }

        const studentIds = students.map(s => s._id);

        // 2. BULK FETCH Filtered by Year
        const [allGrades, allBehaviors, allSupportive] = await Promise.all([
            Grade.find({ student: { $in: studentIds }, academicYear }).populate('subject', 'name gradeLevel').populate('assessments.assessmentType', 'name totalMarks month').lean(),
            BehavioralReport.find({ student: { $in: studentIds }, academicYear }),
            SupportiveGrade.find({ student: { $in: studentIds }, academicYear }).populate('subject', 'name').lean()
        ]);

        // 3. Process in Memory
        const classReports = students.map(student => {
            try {
                const rawGrades = allGrades.filter(g => g.student.toString() === student._id.toString());
                const behaviorDocs = allBehaviors.filter(b => b.student.toString() === student._id.toString());
                const rawSupportive = allSupportive.filter(s => s.student.toString() === student._id.toString());

                // Find class placement for this year
                let targetGrade = student.gradeLevel;
                if (academicYear !== student.year && Array.isArray(student.academicHistory)) {
                    const historicalRecord = student.academicHistory.find(h => h.year === academicYear);
                    if (historicalRecord) targetGrade = historicalRecord.gradeAtThatTime;
                }

                const cleanedGrades = mergeDuplicateGrades(rawGrades, targetGrade);
                const statsSem1 = calculateStats(cleanedGrades, 'First Semester');
                const statsSem2 = calculateStats(cleanedGrades, 'Second Semester');

                const supportiveData = processSupportiveGrades(rawSupportive);

                let finalAverage = 0;
                if (statsSem1.avg > 0 && statsSem2.avg > 0) finalAverage = (statsSem1.avg + statsSem2.avg) / 2;
                else finalAverage = statsSem1.avg + statsSem2.avg;

                const gradeNumMatch = targetGrade.match(/\d+/);
                const nextGrade = gradeNumMatch ? parseInt(gradeNumMatch[0]) + 1 : null;
                const promotedStr = nextGrade ? `Grade ${nextGrade}` : 'Next Level';

                return {
                    studentInfo: {
                        _id: student._id,
                        fullName: student.fullName,
                        studentId: student.studentId,
                        gradeLevel: targetGrade,
                        classId: targetGrade,
                        academicYear: academicYear,
                        photoUrl: student.imageUrl,
                        sex: student.gender,
                        age: calculateAge(student.dateOfBirth),
                        promotedTo: finalAverage >= 50 ? promotedStr : 'Retained',
                    },
                    grades: cleanedGrades,
                    supportiveGrades: supportiveData,
                    semester1: statsSem1,
                    semester2: statsSem2,
                    finalAverage: parseFloat(finalAverage.toFixed(2)),
                    behavior: processBehaviorData(behaviorDocs),
                    footerData: processAttendanceAndConduct(behaviorDocs),
                    rank: null
                };

            } catch (err) {
                console.error(`Error processing student ${student.fullName}:`, err);
                return null;
            }
        }).filter(r => r !== null);

        res.json({ success: true, count: classReports.length, data: classReports });

    } catch (error) {
        console.error("Batch Report Error:", error);
        res.status(500).json({ message: 'Server Error generating class reports' });
    }
};


// @desc    Get Lightweight Data for Certificates (Rank, Total, Avg only)
// @route   GET /api/reports/certificate-data
exports.getCertificateData = async (req, res) => {
    const { gradeLevel, academicYear } = req.query;

    if (!gradeLevel || !academicYear) {
        return res.status(400).json({ message: 'Grade Level and Academic Year are required.' });
    }

    try {
        // 1. ALIGNED: Find all students who took this gradeLevel during the targeted year [1]
        const studentQuery = {
            $or: [
                { year: academicYear, gradeLevel: gradeLevel },
                {
                    academicHistory: {
                        $elemMatch: {
                            year: academicYear,
                            gradeAtThatTime: gradeLevel
                        }
                    }
                }
            ]
        };

        const students = await Student.find(studentQuery)
            .select('studentId fullName gender dateOfBirth photoUrl academicHistory year')
            .sort({ fullName: 1 });

        if (students.length === 0) return res.status(404).json({ message: 'No students found.' });

        // 2. Fetch Only ACADEMIC Subjects
        const academicSubjects = await Subject.find({ gradeLevel }).sort({ name: 1 }).lean();
        
        // 3. Fetch Grades
        const studentIds = students.map(s => s._id);
        const grades = await Grade.find({ student: { $in: studentIds }, academicYear })
            .select('student subject semester finalScore'); 

        // --- CALCULATE TOTALS & AVERAGES ---
        let certificateList = students.map(student => {
            let s1Total = 0, s1Count = 0;
            let s2Total = 0, s2Count = 0;

            // Iterate through Academic Subjects only
            academicSubjects.forEach(sub => {
                const g1 = grades.find(g => g.student.equals(student._id) && g.subject.equals(sub._id) && g.semester === 'First Semester');
                const g2 = grades.find(g => g.student.equals(student._id) && g.subject.equals(sub._id) && g.semester === 'Second Semester');

                const score1 = g1 && g1.finalScore !== null ? parseFloat(g1.finalScore) : null;
                const score2 = g2 && g2.finalScore !== null ? parseFloat(g2.finalScore) : null;

                if (score1 !== null && !isNaN(score1)) {
                    s1Total += score1;
                    s1Count++;
                }

                if (score2 !== null && !isNaN(score2)) {
                    s2Total += score2;
                    s2Count++;
                }
            });

            // Averages
            const s1Avg = s1Count > 0 ? s1Total / s1Count : 0;
            const s2Avg = s2Count > 0 ? s2Total / s2Count : 0;

            let overallAvgCalc = 0;
            let divisor = 0;
            if (s1Count > 0) { overallAvgCalc += s1Avg; divisor++; }
            if (s2Count > 0) { overallAvgCalc += s2Avg; divisor++; }
            
            const finalOverallAvg = divisor > 0 ? overallAvgCalc / divisor : 0;
            const finalOverallTotal = s1Total + s2Total;

            return {
                _id: student._id,
                studentId: student.studentId,
                fullName: student.fullName,
                gender: student.gender,
                photoUrl: student.photoUrl,
                
                sem1: {
                    total: parseFloat(s1Total.toFixed(2)),
                    avg: parseFloat(s1Avg.toFixed(2)),
                    rank: 0 
                },

                sem2: {
                    total: parseFloat(s2Total.toFixed(2)),
                    avg: parseFloat(s2Avg.toFixed(2)),
                    rank: 0 
                },

                overall: {
                    total: parseFloat(finalOverallTotal.toFixed(2)),
                    avg: parseFloat(finalOverallAvg.toFixed(2)),
                    rank: 0 
                }
            };
        });

        // --- RANKING LOGIC ---

        // 1. Rank Semester 1
        certificateList.sort((a, b) => b.sem1.avg - a.sem1.avg);
        let currentRank = 1;
        for (let i = 0; i < certificateList.length; i++) {
            if (i > 0 && certificateList[i].sem1.avg < certificateList[i - 1].sem1.avg) { currentRank = i + 1; }
            certificateList[i].sem1.rank = certificateList[i].sem1.avg > 0 ? currentRank : '-';
        }

        // 2. Rank Semester 2
        certificateList.sort((a, b) => b.sem2.avg - a.sem2.avg);
        currentRank = 1;
        for (let i = 0; i < certificateList.length; i++) {
            if (i > 0 && certificateList[i].sem2.avg < certificateList[i - 1].sem2.avg) { currentRank = i + 1; }
            certificateList[i].sem2.rank = certificateList[i].sem2.avg > 0 ? currentRank : '-';
        }

        // 3. Rank Overall
        certificateList.sort((a, b) => b.overall.avg - a.overall.avg);
        currentRank = 1;
        for (let i = 0; i < certificateList.length; i++) {
            if (i > 0 && certificateList[i].overall.avg < certificateList[i - 1].overall.avg) { currentRank = i + 1; }
            const hasData = certificateList[i].sem1.total > 0 || certificateList[i].sem2.total > 0;
            certificateList[i].overall.rank = hasData ? currentRank : '-';
        }

        // 4. Final Sort: Alphabetical (Standard for lists)
        certificateList.sort((a, b) => a.fullName.localeCompare(b.fullName));

        res.json({ success: true, count: certificateList.length, data: certificateList });

    } catch (error) {
        console.error("Certificate Data Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ... imports (Student, Grade, Subject)
exports.getHighScorers = async (req, res) => {
    const { academicYear } = req.query;

    if (!academicYear) {
        return res.status(400).json({ message: 'Academic Year is required.' });
    }

    try {
        // --- STEP 1: AGGREGATION (Calculate Totals) ---
        const studentTotals = await Grade.aggregate([
            { $match: { academicYear: academicYear } },
            { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
            { $unwind: '$studentInfo' },
            { $match: { 'studentInfo.status': 'Active' } },
            { $lookup: { from: 'subjects', localField: 'subject', foreignField: '_id', as: 'subjectInfo' } },
            { $unwind: '$subjectInfo' },
            
            // ALIGNED: Allows matching gradeLevel using either active year OR historical academicHistory
            { 
                $match: { 
                    $expr: { 
                        $or: [
                            // Current Active Year matches
                            {
                                $and: [
                                    { $eq: ["$studentInfo.year", academicYear] },
                                    { $eq: ["$studentInfo.gradeLevel", "$subjectInfo.gradeLevel"] }
                                ]
                            },
                            // Historical Year matches in academicHistory array [1]
                            {
                                $anyElementTrue: {
                                    $map: {
                                        input: "$studentInfo.academicHistory",
                                        as: "hist",
                                        in: {
                                            $and: [
                                                { $eq: ["$$hist.year", academicYear] },
                                                { $eq: ["$$hist.gradeAtThatTime", "$subjectInfo.gradeLevel"] }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                } 
            },
            
            // GROUPING: Calculate SUMS only
            {
                $group: {
                    _id: "$student",
                    fullName: { $first: "$studentInfo.fullName" },
                    studentId: { $first: "$studentInfo.studentId" },
                    gradeLevel: { $first: "$subjectInfo.gradeLevel" }, // Keep target grade Level
                    photoUrl: { $first: "$studentInfo.imageUrl" },
                    gender: { $first: "$studentInfo.gender" },
                    
                    s1Sum: { $sum: { $cond: [{ $eq: ["$semester", "First Semester"] }, "$finalScore", 0] } },
                    s2Sum: { $sum: { $cond: [{ $eq: ["$semester", "Second Semester"] }, "$finalScore", 0] } }
                }
            },
            {
                $addFields: {
                    overallTotal: { $add: ["$s1Sum", "$s2Sum"] }
                }
            }
        ]);

        // --- STEP 2: RANKING LOGIC ---
        const groupedByGrade = {};

        studentTotals.forEach(student => {
            if (!groupedByGrade[student.gradeLevel]) {
                groupedByGrade[student.gradeLevel] = [];
            }
            groupedByGrade[student.gradeLevel].push(student);
        });

        const finalResult = {};

        Object.keys(groupedByGrade).forEach(grade => {
            const classList = groupedByGrade[grade];

            const getTop3 = (key) => {
                const processedList = classList.map(s => ({
                    ...s,
                    compareVal: parseFloat(s[key].toFixed(2)) 
                }));

                const sorted = processedList
                    .filter(s => s.compareVal > 0) 
                    .sort((a, b) => b.compareVal - a.compareVal);

                const results = [];
                let currentRank = 1;

                for (let i = 0; i < sorted.length; i++) {
                    if (i > 0 && sorted[i].compareVal < sorted[i - 1].compareVal) {
                        currentRank = i + 1;
                    }

                    if (currentRank > 3) break;

                    results.push({
                        _id: sorted[i]._id,
                        fullName: sorted[i].fullName,
                        studentId: sorted[i].studentId,
                        photoUrl: sorted[i].photoUrl,
                        gender: sorted[i].gender,
                        average: sorted[i].compareVal, 
                        rank: currentRank
                    });
                }
                return results;
            };

            finalResult[grade] = {
                sem1: getTop3('s1Sum'),       
                sem2: getTop3('s2Sum'),       
                overall: getTop3('overallTotal') 
            };
        });

        res.json({ success: true, data: finalResult });

    } catch (error) {
        console.error("High Scorer Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};