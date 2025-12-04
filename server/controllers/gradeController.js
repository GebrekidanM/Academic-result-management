const Grade = require('../models/Grade');
const Student = require('../models/Student');
const AssessmentType = require('../models/AssessmentType');

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

// @desc    Get all grades for a specific student
// @route   GET /api/grades/student/:studentId
exports.getGradesByStudent = async (req, res) => {
  try {
    const studentId = req.params.id || req.params.studentId;

    const grades = await Grade.find({ student: studentId })
      .populate('subject', 'name gradeLevel')
      .populate('assessments.assessmentType', 'name totalMarks month');

    if (!grades.length) return res.status(200).json({ success: true, data: [] });
    // Role-based filtering
    if (req.user?.role === 'teacher' && req.user.subjectsTaught) {
      const teacherSubjectIds = new Set(
        req.user.subjectsTaught.map(s => s.subject?._id?.toString())
      );
      const filtered = grades.filter(g => teacherSubjectIds.has(g.subject._id.toString()));
      return res.status(200).json({ success: true, count: filtered.length, data: filtered });
    }

    res.status(200).json({ success: true, count: grades.length, data: grades });
  } catch (error) {
    console.error("Error fetching grades by student:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get grade details (by student, subject, semester, year)
// @route   GET /api/grades/details?studentId=&subjectId=&semester=&academicYear=
exports.getGradeDetails = async (req, res) => {
  const { studentId, subjectId, semester, academicYear } = req.query;
  try {
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

// @desc    Get grade sheet (students + scores for one assessment type)
// @route   GET /api/grades/sheet?assessmentTypeId=
exports.getGradeSheet = async (req, res) => {
  const { assessmentTypeId } = req.query;
  if (!assessmentTypeId) return res.status(400).json({ message: 'Assessment Type ID is required.' });

  try {
    const assessmentType = await AssessmentType.findById(assessmentTypeId);
    if (!assessmentType) return res.status(404).json({ message: 'Assessment Type not found.' });

    const students = await Student.find({ gradeLevel: assessmentType.gradeLevel, status: 'Active' })
      .sort({ fullName: 1 })
      .select('fullName');

    const grades = await Grade.find({
      student: { $in: students.map(s => s._id) },
      'assessments.assessmentType': assessmentTypeId
    });

    const result = students.map(student => {
      const grade = grades.find(g => g.student.equals(student._id));
      const score = grade?.assessments.find(a => a.assessmentType.equals(assessmentTypeId))?.score ?? null;
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

    res.status(200).json({ success: true, message: 'Grades saved or updated successfully.' });
  } catch (error) {
    console.error("Error saving grade sheet:", error);
    res.status(500).json({ message: 'Server error saving grades.' });
  }
};


exports.aGradeAnalysis = async(req,res)=>{
    const {assessment} = req.params
    console.log(assessment)
    try {
      
    } catch (error) {
      
    }
    res.status(200).json()
}

// Remove null assessmentTypes and recalc finalScore
exports.cleanBrokenAssessments = async (req, res) => {
  try {
    // 1. Find all Grades where assessmentType is null
    const grades = await Grade.find({
      "assessments.assessmentType": null
    });

    if (grades.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No broken assessments found."
      });
    }

    for (let grade of grades) {
      // 2. Remove all broken assessments
      grade.assessments = grade.assessments.filter(a => a.assessmentType !== null);

      // 3. Recalculate finalScore after removal
      const totalScore = grade.assessments.reduce(
        (sum, a) => sum + (a.score || 0),
        0
      );

      grade.finalScore = totalScore;

      // 4. Save updated grade
      await grade.save();
    }

    res.status(200).json({
      success: true,
      message: "Broken assessments removed and final scores recalculated.",
      cleanedRecords: grades.length
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
