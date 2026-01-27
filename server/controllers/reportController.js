const Grade = require('../models/Grade');
const Student = require('../models/Student');
const BehavioralReport = require('../models/BehavioralReport');
const SupportiveGrade = require('../models/SupportiveGrade');
const calculateAge = require("../utils/calculateAge")

/**
 * HELPER 1: CLEAN & MERGE ACADEMIC GRADES (Numeric)
 * - Filters by current grade level.
 * - Merges duplicate subjects.
 * - Deduplicates assessments.
 */
const mergeDuplicateGrades = (rawGrades, currentGradeLevel) => {
    // 1. Strict Filter: Only keep subjects for the current Grade Level
    const filteredGrades = rawGrades.filter(g => 
        g.subject && g.subject.gradeLevel === currentGradeLevel
    );

    const gradeMap = new Map();

    filteredGrades.forEach(grade => {
        // Clean assessments (remove nulls)
        const cleanAssessments = (grade.assessments || []).filter(a => a.assessmentType != null);
        
        // Key: "First Semester-Mathematics"
        const key = `${grade.semester}-${grade.subject.name.trim().toLowerCase()}`;

        if (gradeMap.has(key)) {
            const existing = gradeMap.get(key);
            
            // Prefer entry with valid Academic Year
            if (!existing.academicYear && grade.academicYear) {
                existing.academicYear = grade.academicYear;
            }

            // Deduplicate Assessments by ID
            const assessmentMap = new Map();
            existing.assessments.forEach(a => assessmentMap.set(a.assessmentType._id.toString(), a));
            
            cleanAssessments.forEach(a => {
                const id = a.assessmentType._id.toString();
                if (!assessmentMap.has(id)) assessmentMap.set(id, a);
            });

            existing.assessments = Array.from(assessmentMap.values());
            
            // Recalculate Final Score
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
 * Groups data by Subject Name so Sem 1 and Sem 2 appear in one row.
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
 * HELPER 3: CALCULATE STATS (Sum & Average for Academic Only)
 */
const calculateStats = (cleanedGrades, semesterName) => {
    const semesterGrades = cleanedGrades.filter(g => g.semester === semesterName);
    
    if (semesterGrades.length === 0) return { sum: 0, avg: 0 };

    const totalScore = semesterGrades.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
    const average = totalScore / semesterGrades.length;

    return { 
        sum: parseFloat(totalScore.toFixed(0)), 
        avg: parseFloat(average.toFixed(1)) 
    };
};

/**
 * HELPER 4: PROCESS BEHAVIOR TRAITS
 */
const processBehaviorData = (behaviorDocs) => {
  const sem1 = behaviorDocs.find(b => b.semester === 'First Semester');
  const sem2 = behaviorDocs.find(b => b.semester === 'Second Semester');

  const standardTraits = [
      "Punctuality", "Attendance",
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
 * @route GET /api/reports/student/:studentId
 */
exports.generateStudentReport = async (req, res) => {
  try {
    const targetStudentId = req.params.studentId || req.params.id;

    // 1. Find Student
    const student = await Student.findById(targetStudentId);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    // 2. Fetch All Raw Data Parallelly
    const [rawGrades, behaviorDocs, rawSupportive] = await Promise.all([
        Grade.find({ student: student._id }).populate('subject', 'name gradeLevel').populate('assessments.assessmentType', 'name totalMarks month').lean(),
        BehavioralReport.find({ student: student._id }),
        SupportiveGrade.find({ student: student._id }).populate('subject', 'name').lean()
    ]);

    // 3. Process Academic Grades (Numeric)
    const currentGradeLevel = student.gradeLevel.trim();
    const cleanedGrades = mergeDuplicateGrades(rawGrades, currentGradeLevel);

    // 4. Calculate Stats (Academic Only)
    const statsSem1 = calculateStats(cleanedGrades, 'First Semester');
    const statsSem2 = calculateStats(cleanedGrades, 'Second Semester');

    let studentFinalAvg = 0;
    if (statsSem1.avg > 0 && statsSem2.avg > 0) studentFinalAvg = (statsSem1.avg + statsSem2.avg) / 2;
    else studentFinalAvg = statsSem1.avg + statsSem2.avg;

    // 5. Process Supportive Grades (Letters)
    const supportiveData = processSupportiveGrades(rawSupportive);

    // 6. Promotion Logic
    const gradeNumMatch = student.gradeLevel.match(/\d+/);
    const nextGrade = gradeNumMatch ? parseInt(gradeNumMatch[0]) + 1 : null;
    const promotedStr = nextGrade ? `Grade ${nextGrade}` : 'Next Level';

    // 7. Assemble Response
    const finalReport = {
      studentInfo: {
        fullName: student.fullName,
        studentId: student.studentId,
        sex: student.gender,
        age: calculateAge(student.dateOfBirth),
        classId: student.gradeLevel,
        academicYear: rawGrades[0]?.academicYear || '2018',
        photoUrl: student.imageUrl,
        promotedTo: studentFinalAvg >= 50 ? promotedStr : 'Retained',
      },
      semester1: statsSem1,
      semester2: statsSem2,
      finalAverage: parseFloat(studentFinalAvg.toFixed(2)),
      
      // Academic Data
      grades: cleanedGrades, 
      
      // Non-Academic Data (New Field)
      supportiveGrades: supportiveData, 
      
      // Behavior & Footer
      behavior: processBehaviorData(behaviorDocs),
      footerData: processAttendanceAndConduct(behaviorDocs),
      
      rank: null // Rank is fetched by frontend service
    };

    res.status(200).json(finalReport);

  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: 'Server error generating report' });
  }
};

/**
 * @desc    Generate Reports for an Entire Class (OPTIMIZED BATCH)
 * @route   GET /api/reports/class/:gradeLevel
 */
exports.generateClassReports = async (req, res) => {
    try {
        const { gradeLevel } = req.params;
        const { academicYear } = req.query; 

        // 1. Find all Active Students in this Grade
        const students = await Student.find({ gradeLevel, status: 'Active' }).sort({ fullName: 1 });

        if (!students.length) {
            return res.status(404).json({ message: 'No students found in this grade.' });
        }

        const studentIds = students.map(s => s._id);

        // 2. BULK FETCH (Optimization: 3 DB calls instead of 3 * N)
        // Added SupportiveGrade.find here
        const [allGrades, allBehaviors, allSupportive] = await Promise.all([
            Grade.find({ student: { $in: studentIds } }).populate('subject', 'name gradeLevel').populate('assessments.assessmentType', 'name totalMarks month').lean(),
            BehavioralReport.find({ student: { $in: studentIds } }),
            SupportiveGrade.find({ student: { $in: studentIds } }).populate('subject', 'name').lean()
        ]);

        // 3. Process in Memory
        const classReports = students.map(student => {
            try {
                // Filter relevant data for this student from the big lists
                const rawGrades = allGrades.filter(g => g.student.toString() === student._id.toString());
                const behaviorDocs = allBehaviors.filter(b => b.student.toString() === student._id.toString());
                const rawSupportive = allSupportive.filter(s => s.student.toString() === student._id.toString());

                // Process Logic (Same as single report)
                const cleanedGrades = mergeDuplicateGrades(rawGrades, student.gradeLevel);
                const statsSem1 = calculateStats(cleanedGrades, 'First Semester');
                const statsSem2 = calculateStats(cleanedGrades, 'Second Semester');

                // Process Supportive Grades (Letters)
                const supportiveData = processSupportiveGrades(rawSupportive);

                let finalAverage = 0;
                if (statsSem1.avg > 0 && statsSem2.avg > 0) finalAverage = (statsSem1.avg + statsSem2.avg) / 2;
                else finalAverage = statsSem1.avg + statsSem2.avg;

                const gradeNumMatch = student.gradeLevel.match(/\d+/);
                const nextGrade = gradeNumMatch ? parseInt(gradeNumMatch[0]) + 1 : null;
                const promotedStr = nextGrade ? `Grade ${nextGrade}` : 'Next Level';

                return {
                    studentInfo: {
                        fullName: student.fullName,
                        studentId: student.studentId,
                        gradeLevel: student.gradeLevel,
                        classId: student.gradeLevel,
                        academicYear: cleanedGrades[0]?.academicYear || academicYear || '2018',
                        photoUrl: student.imageUrl,
                        sex: student.gender,
                        age: calculateAge(student.dateOfBirth),
                        promotedTo: finalAverage >= 50 ? promotedStr : 'Retained',
                    },
                    grades: cleanedGrades,
                    supportiveGrades: supportiveData, // <--- Added this to the batch report
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
        }).filter(r => r !== null); // Remove failed entries

        res.json({ success: true, count: classReports.length, data: classReports });

    } catch (error) {
        console.error("Batch Report Error:", error);
        res.status(500).json({ message: 'Server Error generating class reports' });
    }
};