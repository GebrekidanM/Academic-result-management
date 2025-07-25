// server/controllers/reportController.js

const Student = require('../models/Student');

/**
 * Helper function to calculate sum and average for a semester's grades.
 * It carefully handles cases where grades might be missing or not numbers.
 * @param {object} grades - The grades object for a semester (e.g., { 'Math': 90, 'ENG': 85 }).
 * @returns {object} - An object containing the sum and average { sum: 175, avg: 87.5 }.
 */
const calculateSemesterStats = (grades) => {
  // If grades are null, undefined, or not an object, return zero stats.
  if (!grades || typeof grades !== 'object') {
    return { sum: 0, avg: 0 };
  }
  
  // Filter out non-numeric values (like 'Conduct': 'A') before calculating.
  const numericScores = Object.values(grades).filter(value => typeof value === 'number');

  if (numericScores.length === 0) {
    return { sum: 0, avg: 0 };
  }

  const sum = numericScores.reduce((total, score) => total + score, 0);
  const avg = sum / numericScores.length;
  
  // Return the sum and a precisely formatted average.
  return { sum, avg: parseFloat(avg.toFixed(2)) };
};

/**
 * @desc    Generate a full, detailed report card for a single student.
 * @route   GET /api/reports/student/:studentId
 * @access  Private (should be protected by auth middleware later)
 */
exports.generateStudentReport = async (req, res) => {
  try {
    // 1. Find the target student using their unique studentId.
    const student = await Student.findOne({ studentId: req.params.studentId });

    if (!student) {
      return res.status(404).json({ message: 'Student not found with the specified ID.' });
    }

    // --- RANK CALCULATION LOGIC ---
    // a. To calculate rank, we need to compare with all students in the same class.
    const classmates = await Student.find({ classId: student.classId });

    // b. Calculate the final average for every single student in the class.
    const studentAverages = classmates.map(s => {
      // Safely access nested grade objects using optional chaining (?.) and provide fallbacks.
      const sem1Grades = s.grades?.sem1?.toObject() || {};
      const sem2Grades = s.grades?.sem2?.toObject() || {};
      
      const sem1Stats = calculateSemesterStats(sem1Grades);
      const sem2Stats = calculateSemesterStats(sem2Grades);

      // Final average is the average of the two semester averages.
      const finalAverage = (sem1Stats.avg + sem2Stats.avg) / 2;

      return { 
        studentId: s.studentId, 
        finalAverage: parseFloat(finalAverage.toFixed(2)) 
      };
    });

    // c. Sort the averages in descending order (highest score first).
    studentAverages.sort((a, b) => b.finalAverage - a.finalAverage);

    // d. Find the 0-based index of our student in the sorted list and add 1 to get the rank.
    const rank = studentAverages.findIndex(s => s.studentId === student.studentId) + 1;


    // --- ASSEMBLE THE FINAL REPORT OBJECT ---
    // Calculate stats for our target student.
    const studentSem1Stats = calculateSemesterStats(student.grades?.sem1?.toObject());
    const studentSem2Stats = calculateSemesterStats(student.grades?.sem2?.toObject());
    const studentFinalAverage = (studentSem1Stats.avg + studentSem2Stats.avg) / 2;

    // Structure the data exactly as the frontend expects it.
    const finalReport = {
      studentInfo: {
        fullName: student.fullName,
        studentId: student.studentId,
        sex: student.sex,
        age: student.age,
        classId: student.classId,
        academicYear: '2017 E.C / 2024/25 G.C', // This can be made dynamic later
        photoUrl: student.photoUrl,
        promotedTo: student.promotedTo,
      },
      grades: student.grades,
      attendance: student.attendance,
      semester1: studentSem1Stats,
      semester2: studentSem2Stats,
      finalAverage: parseFloat(studentFinalAverage.toFixed(2)),
      rank: rank || 'N/A',
      classSize: classmates.length,
      // Placeholder for behavior skills data. This would be a separate feature.
      behaviorProgress: [
          { area: 'Punctuality', result: 'E' },
          { area: 'Attendance', result: 'E' },
          { area: 'Neatness', result: 'VG' },
          { area: 'Honesty', result: 'E' },
      ]
    };

    // 3. Send the complete report object back to the client.
    res.status(200).json(finalReport);

  } catch (error) {
    // If anything goes wrong, log the error and send a generic server error message.
    console.error('Error generating student report:', error);
    res.status(500).json({ message: 'An internal server error occurred while generating the report.' });
  }
};