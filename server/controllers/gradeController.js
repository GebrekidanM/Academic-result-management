const Grade = require('../models/Grade');
const Student = require('../models/Student');
const AssessmentType = require('../models/AssessmentType');
const sendSystemNotification = require('../utils/sendSystemNotification'); 

// @desc    Get a single grade by ID
// @route   GET /api/grades/:id
exports.getGradeById = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id).populate('subject', 'name');
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    res.status(200).json({ success: true, data: grade });
  } catch (error) {
    console.error("Error fetching grade by ID:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all grades
// @route   GET /api/grades
exports.getGrades = async (req, res) => {
  try {
    const grades = await Grade.find({})
      .populate('student', 'fullName studentId')
      .populate('subject', 'name');
    res.status(200).json({ success: true, count: grades.length, data: grades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const Grade = require('../models/Grade');
const Student = require('../models/Student');

// @desc    Get all grades for a specific student (With Merge Logic)
// @route   GET /api/grades/student/:studentId
exports.getGradesByStudent = async (req, res) => {
  try {
    const studentId = req.params.id || req.params.studentId;

    // 1. Validate Student
    const studentObj = await Student.findById(studentId);
    if (!studentObj) return res.status(404).json({ message: "Student not found" });
    
    // 2. Fetch Raw Grades
    let rawGrades = await Grade.find({ student: studentId })
      .populate('subject', 'name gradeLevel')
      .populate('assessments.assessmentType', 'name totalMarks month');

    if (!rawGrades.length) return res.status(200).json({ success: true, data: [] });

    // 3. Clean & Merge Duplicates
    // This fixes the "Grade 4A" vs "Grade 4B" duplicate subject issue
    const gradeMap = new Map();

    rawGrades.forEach(gradeDoc => {
      // Convert to plain object to allow modification
      const grade = gradeDoc.toObject();

      // Skip if subject was deleted
      if (!grade.subject) return;

      // Filter null assessments (just in case)
      if (grade.assessments) {
        grade.assessments = grade.assessments.filter(a => a.assessmentType !== null);
      }

      // Create a unique key based on Semester + Subject Name
      // We trim whitespace to be safe
      const subjectName = grade.subject.name.trim();
      const uniqueKey = `${grade.semester}-${subjectName}`;

      if (gradeMap.has(uniqueKey)) {
        // --- MERGE LOGIC ---
        const existing = gradeMap.get(uniqueKey);

        // A. Combine Assessments
        existing.assessments = [...existing.assessments, ...grade.assessments];

        // B. Update Final Score (Summing them up)
        // Recalculating from assessments is safer than just adding finalScores
        const newTotal = existing.assessments.reduce((sum, a) => sum + (a.score || 0), 0);
        existing.finalScore = newTotal;

        // Keep the latest ID, but the logic effectively merges them into one display object
      } else {
        // Add new entry
        gradeMap.set(uniqueKey, grade);
      }
    });

    let processedGrades = Array.from(gradeMap.values());

    // 4. Role-based filtering (Teacher View)
    if (req.user?.role === 'teacher') {
        const isHomeroom = req.user.homeroomGrade === studentObj.gradeLevel;

        if (!isHomeroom) {
            // Get IDs of subjects this teacher teaches
            const teacherSubjectIds = new Set(
                req.user.subjectsTaught.map(s => s.subject?._id?.toString())
            );

            // Filter the processed list
            processedGrades = processedGrades.filter(g => {
                // Check if the grade's subject ID is in the teacher's list
                return teacherSubjectIds.has(g.subject._id.toString());
            });
        }
    }

    // 5. Sort for cleaner API response (Optional but recommended)
    // Sort by Semester (First -> Second), then by Subject Name (A-Z)
    processedGrades.sort((a, b) => {
        if (a.semester === b.semester) {
            return a.subject.name.localeCompare(b.subject.name);
        }
        return a.semester.localeCompare(b.semester); // "First" comes before "Second" alphabetically anyway
    });

    res.status(200).json({ success: true, count: processedGrades.length, data: processedGrades });

  } catch (error) {
    console.error("Error fetching grades by student:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get grade details (by student, subject, semester, year)
// @route   GET /api/grades/details
exports.getGradeDetails = async (req, res) => {
  const { studentId, subjectId, semester, academicYear } = req.query;
  try {
    // Note: If you have duplicates in DB, 'findOne' might pick the wrong one (e.g. the 4B one).
    // Ideally, you should use 'find' here too and merge if you want to be 100% safe, 
    // but usually editing happens on a specific ID.
    
    const grade = await Grade.findOne({ student: studentId, subject: subjectId, semester, academicYear })
      .populate('assessments.assessmentType', 'name totalMarks');
      
    res.json({ success: true, data: grade });
  } catch (error) {
    console.error("Error fetching grade details:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a grade (only teachers can delete)
// @route   DELETE /api/grades/:id
exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });

    if (req.user.role === 'admin') {
      return res.status(403).json({ message: "Admins cannot delete grade records." });
    }

    await grade.deleteOne();
    res.status(200).json({ success: true, message: 'Grade deleted successfully.' });
  } catch (error) {
    console.error("Error deleting grade:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a grade entry
// @route   PUT /api/grades/:id
exports.updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });

    if (req.user.role === 'admin') {
      return res.status(403).json({ message: "Admins cannot alter grade records." });
    }

    const { assessments } = req.body;
    if (!Array.isArray(assessments) || assessments.length === 0) {
      return res.status(400).json({ message: 'No assessments provided.' });
    }

    const assessmentTypeIds = assessments.map(a => a.assessmentType);
    const defs = await AssessmentType.find({ _id: { $in: assessmentTypeIds } });

    let finalScore = 0;
    for (const a of assessments) {
      const def = defs.find(d => d._id.equals(a.assessmentType));
      if (!def) return res.status(400).json({ message: `Invalid assessmentType ID: ${a.assessmentType}` });
      if (a.score > def.totalMarks)
        return res.status(400).json({ message: `${def.name} score cannot exceed ${def.totalMarks}` });
      finalScore += Number(a.score);
    }

    grade.assessments = assessments;
    grade.finalScore = finalScore;
    const updated = await grade.save();

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating grade:", error);
    res.status(500).json({ message: 'Server error updating grade.' });
  }
};

// @desc    Get grade sheet
exports.getGradeSheet = async (req, res) => {
  const { assessmentTypeId } = req.query;
  if (!assessmentTypeId) return res.status(400).json({ message: 'Assessment Type ID is required.' });

  try {
    const assessmentType = await AssessmentType.findById(assessmentTypeId);
    if (!assessmentType) return res.status(404).json({ message: 'Assessment Type not found.' });

    const students = await Student.find({ gradeLevel: assessmentType.gradeLevel, status: 'Active' })
      .sort({ fullName: 1 })
      .select('fullName');

    // Populate assessmentType to ensure we don't work with raw IDs causing type mismatches
    const grades = await Grade.find({
      student: { $in: students.map(s => s._id) },
      'assessments.assessmentType': assessmentTypeId
    }).populate('assessments.assessmentType'); // <--- ADD POPULATE FOR SAFETY

    const result = students.map(student => {
      const grade = grades.find(g => g.student.equals(student._id));
      
      // --- FIX: Add Safe Check (a.assessmentType && ...) ---
      const score = grade?.assessments.find(a => 
          a.assessmentType && a.assessmentType._id.equals(assessmentTypeId)
      )?.score ?? null;
      
      return { _id: student._id, fullName: student.fullName, score };
    });

    res.status(200).json({ assessmentType, students: result });
  } catch (error) {
    console.error("Error fetching grade sheet:", error);
    res.status(500).json({ message: 'Server error fetching grade sheet.' });
  }
};
// @desc    Save or update multiple grades for one assessment
// @route   POST /api/grades/sheet
exports.saveGradeSheet = async (req, res) => {
  const { assessmentTypeId, subjectId, semester, academicYear, scores } = req.body;

  const ethiopianYear = parseInt(new Intl.DateTimeFormat('en-US', { calendar: 'ethiopic', year: 'numeric' }).format(new Date()).replace(/\D/g, ''));

  if(academicYear > ethiopianYear){
    return res.status(400).json({message: "You did not inter the correct year."})
  }

  if (!assessmentTypeId || !subjectId || !Array.isArray(scores)) {
    return res.status(400).json({ message: 'Missing required data.' });
  }

  try {
    // Perform all updates in parallel
    const updatePromises = scores.map(async ({ studentId, score }) => {
      if (score == null || score === '' || isNaN(score)) return;

      // Update existing assessment
      const updateResult = await Grade.updateOne(
        {
          student: studentId,
          subject: subjectId,
          semester,
          academicYear,
          "assessments.assessmentType": assessmentTypeId
        },
        {
          $set: {
            "assessments.$.score": score,
            semester,
            academicYear,
            subject: subjectId
          }
        }
      );

      // If no match, push new assessment
      if (updateResult.matchedCount === 0) {
        await Grade.updateOne(
          { student: studentId, subject: subjectId, semester, academicYear },
          {
            $setOnInsert: { student: studentId, subject: subjectId, semester, academicYear },
            $push: { assessments: { assessmentType: assessmentTypeId, score } }
          },
          { upsert: true }
        );
      }

      const gradeDoc = await Grade.findOne({ student: studentId, subject: subjectId, semester, academicYear });
      if (gradeDoc) {
        const validAssessments = gradeDoc.assessments.filter(a => a.score !== null && a.score !== undefined);

        const totalScore = validAssessments.reduce(
          (sum, a) => sum + (a.score || 0),
          0
        );

        gradeDoc.finalScore = totalScore;
        await gradeDoc.save();
      }
    });
    await Promise.all(updatePromises);

    // --- NEW: TRIGGER NOTIFICATION ---
        // 1. Get Details for the message
        const assessment = await AssessmentType.findById(assessmentTypeId).populate('subject');
        
        if (assessment) {
            const subjectName = assessment.subject?.name || "Subject";
            
            await sendSystemNotification(
                `Grades Posted: ${subjectName} 📊`,
                `Results for ${assessment.name} (${semester}) have been released. Check the dashboard.`,
                ['parent', 'admin', 'staff'], // Target Audience
                assessment.gradeLevel, // Only parents of this grade
                req.user._id
            );
        }
        // ---------------------------------



    res.status(200).json({ success: true, message: 'Grades saved or updated successfully.' });
  } catch (error) {
    console.error("Error saving grade sheet:", error);
    res.status(500).json({ message: 'Server error saving grades.' });
  }
};

// @route GET /api/grades/clean
exports.cleanBrokenAssessments = async (req, res) => {
  try {
    console.log("Starting System Cleanup...");
    
    // 1. Fetch ALL grades and populate BOTH subject and assessments
    const allGrades = await Grade.find()
      .populate('assessments.assessmentType')
      .populate('subject'); // <--- Essential to detect null subjects

    let gradesDeleted = 0;
    let gradesFixed = 0;

    for (const grade of allGrades) {
      // --- CASE 1: The Subject is Deleted (Fixes your new problem) ---
      if (!grade.subject) {
        console.log(`CRITICAL: Grade ${grade._id} has no subject. Deleting entire document.`);
        await grade.deleteOne(); 
        gradesDeleted++;
        continue; // Skip the rest, this document is gone
      }

      // --- CASE 2: An Assessment is Deleted (Fixes the previous problem) ---
      const originalCount = grade.assessments.length;
      
      // Keep only assessments where assessmentType is NOT null
      const validAssessments = grade.assessments.filter(a => a.assessmentType !== null);

      if (validAssessments.length < originalCount) {
        grade.assessments = validAssessments;

        // Recalculate Final Score
        grade.finalScore = grade.assessments.reduce(
          (sum, a) => sum + (a.score || 0),
          0
        );

        await grade.save();
        gradesFixed++;
        console.log(`Fixed Grade ${grade._id}: Removed broken assessments.`);
      }
    }

    if (gradesDeleted === 0 && gradesFixed === 0) {
      return res.status(200).json({ success: true, message: "System is clean. No errors found." });
    }

    res.status(200).json({
      success: true,
      message: `Cleanup Complete: Deleted ${gradesDeleted} invalid grade sheets (missing subjects) and fixed ${gradesFixed} grade sheets (missing assessments).`
    });

  } catch (error) {
    console.error("Cleanup Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};