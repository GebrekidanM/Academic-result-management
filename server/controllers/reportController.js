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
            // Assuming you added 'absentDays' to your model, or we look for it in evaluations
            absent: sem1?.absentDays || sem1?.evaluations?.find(e => e.area === 'Attendance')?.result || '-'
        },
        sem2: {
            conduct: sem2?.conduct || '-',
            absent: sem2?.absentDays || sem2?.evaluations?.find(e => e.area === 'Attendance')?.result || '-'
        }
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
    // 1. Find Student
    const targetStudentId = req.params.id; 
    const student = await Student.findById(targetStudentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // 2. Fetch Grades
    const studentGrades = await Grade.find({ student: student._id })
      .populate('subject', 'subjectName name'); 

    // 3. Fetch Behavior Reports
    const studentBehavior = await BehavioralReport.find({ student: student._id });

    // 4. Process Data
    const formattedGrades = transformGradesToReportFormat(studentGrades);
    const statsSem1 = calculateSemesterStats(formattedGrades.sem1);
    const statsSem2 = calculateSemesterStats(formattedGrades.sem2);
    
    // Process Behavior
    const behaviorData = processBehaviorData(studentBehavior);

    // Final Average Calculation
    let studentFinalAvg = 0;
    if (statsSem1.avg > 0 && statsSem2.avg > 0) studentFinalAvg = (statsSem1.avg + statsSem2.avg) / 2;
    else studentFinalAvg = statsSem1.avg + statsSem2.avg;

    const finalReport = {
      studentInfo: {
        fullName: student.fullName,
        studentId: student.studentId,
        sex: student.gender,
        age: calculateAge(student.dateOfBirth),
        classId: student.gradeLevel,
        academicYear: studentGrades[0]?.academicYear,
        photoUrl: student.imageUrl,
        promotedTo: studentFinalAvg >= 60 ? `Grade ${parseInt(student.gradeLevel.match(/\d+)) + 1}` : 'Retained',
      },
      semester1: statsSem1,
      semester2: statsSem2,
      finalAverage: parseFloat(studentFinalAvg.toFixed(2)),
      
      // Data for Tables
      grades: formattedGrades, 
      
      // Behavior Data
      behavior: behaviorData
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