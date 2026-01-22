const Grade = require('../models/Grade');
const Student = require('../models/Student');
const BehavioralReport = require('../models/BehavioralReport');

/**
 * Helper: Calculate Stats
 */
const calculateSemesterStats = (gradesObj) => {
  if (!gradesObj || typeof gradesObj !== 'object') {
    return { sum: 0, avg: 0 };
  }
  const numericScores = Object.values(gradesObj).filter(value => typeof value === 'number');
  if (numericScores.length === 0) return { sum: 0, avg: 0 };

  const sum = numericScores.reduce((total, score) => total + score, 0);
  const avg = sum / numericScores.length;
  return { sum, avg: parseFloat(avg.toFixed(2)) };
};

/**
 * Helper: Transform Grade Array to Object
 */
const transformGradesToReportFormat = (gradeDocs) => {
  const formatted = { sem1: {}, sem2: {} };
  gradeDocs.forEach(g => {
    const subjectName = g.subject?.subjectName || g.subject?.name || 'Unknown Subject';
    if (g.semester === 'First Semester') formatted.sem1[subjectName] = g.finalScore;
    else if (g.semester === 'Second Semester') formatted.sem2[subjectName] = g.finalScore;
  });
  return formatted;
};

const processAttendanceAndConduct = (behaviorDocs) => {
    const sem1 = behaviorDocs.find(b => b.semester === 'First Semester');
    const sem2 = behaviorDocs.find(b => b.semester === 'Second Semester');

    return {
        sem1: {
            conduct: sem1?.conduct || '-',
            absent: sem1?.absent || sem1?.evaluations?.find(e => e.area === 'Attendance')?.result || '-'
        },
        sem2: {
            conduct: sem2?.conduct || '-',
            absent: sem2?.absent || sem2?.evaluations?.find(e => e.area === 'Attendance')?.result || '-'
        }
    };
};

const mergeDuplicateGrades = (rawGrades, currentGradeLevel) => {
    // 1. Strict Filter: Only keep subjects for the current Grade Level
    const filteredGrades = rawGrades.filter(g => 
        g.subject && g.subject.gradeLevel === currentGradeLevel
    );

    const gradeMap = new Map();

    filteredGrades.forEach(grade => {
        // Clean assessments (remove nulls)
        const cleanAssessments = (grade.assessments || []).filter(a => a.assessmentType != null);
        
        // Key: "First Semester-Mathematics" (Normalized)
        const key = `${grade.semester}-${grade.subject.name.trim().toLowerCase()}`;

        if (gradeMap.has(key)) {
            const existing = gradeMap.get(key);
            
            // A. Deduplicate Assessments by ID to prevent score inflation
            const assessmentMap = new Map();
            existing.assessments.forEach(a => assessmentMap.set(a.assessmentType._id.toString(), a));
            
            cleanAssessments.forEach(a => {
                const id = a.assessmentType._id.toString();
                if (!assessmentMap.has(id)) {
                    assessmentMap.set(id, a);
                }
            });

            existing.assessments = Array.from(assessmentMap.values());

            // B. Recalculate Final Score
            existing.finalScore = existing.assessments.reduce((sum, a) => sum + (a.score || 0), 0);

        } else {
            // New Entry - Clone it to avoid reference issues
            const newEntry = grade.toObject ? grade.toObject() : { ...grade };
            newEntry.assessments = cleanAssessments;
            gradeMap.set(key, newEntry);
        }
    });

    return Array.from(gradeMap.values());
};

const calculateStats = (cleanedGrades, semesterName) => {
    const semesterGrades = cleanedGrades.filter(g => g.semester === semesterName);
    
    if (semesterGrades.length === 0) return { sum: 0, avg: 0 };

    const totalScore = semesterGrades.reduce((acc, curr) => acc + (curr.finalScore || 0), 0);
    const average = totalScore / semesterGrades.length;

    return { 
        sum: parseFloat(totalScore.toFixed(0)), // Usually sums are integers
        avg: parseFloat(average.toFixed(1)) 
    };
};


/**
 * Helper: Merge Behavior for Report Card (S1 vs S2)
 */
const processBehaviorData = (behaviorDocs) => {
  const sem1 = behaviorDocs.find(b => b.semester === 'First Semester');
  const sem2 = behaviorDocs.find(b => b.semester === 'Second Semester');

  const standardTraits = [
      "Punctuality", "Attendance",
      'Communication book usage',	"T-book & E-book condition", "Personal hygiene", 
      "Proper dressing of school uniform", "Following school rules and regulation","Communication skill",
      "Participating in class","English language usage"
  ];
  const progressMap = standardTraits.map(trait => {
    const s1Result = sem1?.evaluations?.find(e => e.area === trait)?.result || '-';
    const s2Result = sem2?.evaluations?.find(e => e.area === trait)?.result || '-';
    
    return {
      area: trait,
      sem1: s1Result,
      sem2: s2Result
    };
  });

  return {
    progress: progressMap,
    teacherComments: {
      sem1: sem1?.teacherComment || '',
      sem2: sem2?.teacherComment || ''
    },
    conduct: {
      sem1: sem1?.conduct || '-',
      sem2: sem2?.conduct || '-'
    }
  };
};

/**
 * @desc    Generate Student Report
 * @route   GET /api/reports/student/:id
 */
exports.generateStudentReport = async (req, res) => {
  try {
    const targetStudentId = req.params.studentId || req.params.id; // Handle both param names

    // 1. Find Student
    const student = await Student.findById(targetStudentId);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    // 2. Fetch Raw Data
    // Note: We need 'gradeLevel' from the subject to perform the strict filtering fix
    const rawGrades = await Grade.find({ student: student._id })
      .populate('subject', 'name gradeLevel') 
      .lean(); // Use lean for performance

    const behaviorDocs = await BehavioralReport.find({ student: student._id });

    // 3. CLEAN & MERGE GRADES (The Fix)
    // This replaces your 'transformGradesToReportFormat' with a smarter version
    const cleanedGrades = mergeDuplicateGrades(rawGrades, student.gradeLevel);

    // 4. Calculate Stats
    const statsSem1 = calculateStats(cleanedGrades, 'First Semester');
    const statsSem2 = calculateStats(cleanedGrades, 'Second Semester');

    // Final Average Calculation
    let studentFinalAvg = 0;
    if (statsSem1.avg > 0 && statsSem2.avg > 0) studentFinalAvg = (statsSem1.avg + statsSem2.avg) / 2;
    else studentFinalAvg = statsSem1.avg + statsSem2.avg;

    // Promotion Logic
    const gradeNumMatch = student.gradeLevel.match(/\d+/);
    const nextGrade = gradeNumMatch ? parseInt(gradeNumMatch[0]) + 1 : null;
    const promotedStr = nextGrade ? `Grade ${nextGrade}` : 'Next Level';

    // 5. Assemble Final Response
    const finalReport = {
      studentInfo: {
        fullName: student.fullName,
        studentId: student.studentId,
        sex: student.gender,
        age: calculateAge(student.dateOfBirth),
        classId: student.gradeLevel,
        academicYear: rawGrades[0]?.academicYear || '2018', // Fallback year
        photoUrl: student.imageUrl,
        promotedTo: studentFinalAvg >= 50 ? promotedStr : 'Retained',
      },
      
      // Stats
      semester1: statsSem1,
      semester2: statsSem2,
      finalAverage: parseFloat(studentFinalAvg.toFixed(2)),
      
      // Data Arrays
      grades: cleanedGrades, // Returns the clean Array (Frontend expects this now)
      
      // Behavior Data
      behavior: processBehaviorData(behaviorDocs),

      // Footer Data (Conduct & Absent)
      footerData: processAttendanceAndConduct(behaviorDocs)
    };

    res.status(200).json(finalReport);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating report' });
  }
};

const calculateAge = (dob) => {
  if (!dob) return '-';
  const diff_ms = Date.now() - new Date(dob).getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
};





/**
 * @desc    Generate Reports for an Entire Class (Batch)
 * @route   GET /api/reports/class/:gradeLevel
 */
exports.generateClassReports = async (req, res) => {
    try {
        const { gradeLevel } = req.params;
        const { academicYear } = req.query; // Optional: filter by year

        // 1. Find all Active Students in this Grade
        const students = await Student.find({ gradeLevel, status: 'Active' }).sort({ fullName: 1 });

        if (!students.length) {
            return res.status(404).json({ message: 'No students found in this grade.' });
        }

        const classReports = [];

        // 2. Loop through students and generate data (Server-side is fast)
        // We use Promise.all to run them concurrently for speed
        await Promise.all(students.map(async (student) => {
            try {
                // A. Fetch Raw Data
                const [rawGrades, behaviorDocs] = await Promise.all([
                    Grade.find({ student: student._id }).populate('subject', 'name gradeLevel').lean(),
                    BehavioralReport.find({ student: student._id })
                ]);

                // B. Clean & Merge Grades
                const cleanedGrades = mergeDuplicateGrades(rawGrades, student.gradeLevel);

                // C. Calculate Stats
                const statsSem1 = calculateStats(cleanedGrades, 'First Semester');
                const statsSem2 = calculateStats(cleanedGrades, 'Second Semester');

                // D. Final Avg
                let finalAverage = 0;
                if (statsSem1.avg > 0 && statsSem2.avg > 0) finalAverage = (statsSem1.avg + statsSem2.avg) / 2;
                else finalAverage = statsSem1.avg + statsSem2.avg;

                // E. Promotion Logic
                const gradeNumMatch = student.gradeLevel.match(/\d+/);
                const nextGrade = gradeNumMatch ? parseInt(gradeNumMatch[0]) + 1 : null;
                const promotedStr = nextGrade ? `Grade ${nextGrade}` : 'Next Level';

                // F. Assemble Object
                classReports.push({
                    studentInfo: {
                        fullName: student.fullName,
                        studentId: student.studentId,
                        gradeLevel: student.gradeLevel,
                        classId: student.gradeLevel,
                        academicYear: cleanedGrades[0]?.academicYear || academicYear || '2018',
                        photoUrl: student.imageUrl,
                        sex: student.gender,
                        dateOfBirth: student.dateOfBirth,
                        promotedTo: finalAverage >= 50 ? promotedStr : 'Retained',
                    },
                    grades: cleanedGrades,
                    semester1: statsSem1,
                    semester2: statsSem2,
                    finalAverage: parseFloat(finalAverage.toFixed(2)),
                    behavior: processBehaviorData(behaviorDocs),
                    footerData: processAttendanceAndConduct(behaviorDocs),
                    rank: null // Rank will be fetched/calculated separately or you can integrate rank calculation here too
                });

            } catch (err) {
                console.error(`Error processing student ${student.fullName}:`, err);
            }
        }));

        // 3. Sort Alphabetically by Name
        classReports.sort((a, b) => a.studentInfo.fullName.localeCompare(b.studentInfo.fullName));

        res.json({ success: true, count: classReports.length, data: classReports });

    } catch (error) {
        console.error("Batch Report Error:", error);
        res.status(500).json({ message: 'Server Error generating class reports' });
    }
};