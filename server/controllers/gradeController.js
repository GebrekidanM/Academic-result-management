const Grade = require('../models/Grade');
const Student = require('../models/Student');
const AssessmentType = require('../models/AssessmentType');
const sendSystemNotification = require('../utils/sendSystemNotification'); 
const mongoose = require('mongoose');


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

// @desc    Get grades by student ID
// @route   GET /api/grades/student/:studentId
exports.getGradesByStudent = async (req, res) => {
    try {
        // Safe-guard both potential parameter names (studentId or id)
        const studentId = req.params.studentId || req.params.id;

        // If the ID is missing or is not a valid 24-character hex ObjectId, exit immediately
        if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(404).json({ message: 'Grades not found (Invalid Student ID).' });
        }

        // Run your existing query
        const grades = await Grade.find({ student: studentId });
        res.json({ success: true, data: grades });

    } catch (error) {
        console.error("Error in getGradesByStudent:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get grade details (by student, subject, semester, year)
// @route   GET /api/grades/details
exports.getGradeDetails = async (req, res) => {
  const { studentId, subjectId, semester, academicYear } = req.query;
  try {
    const grade = await Grade.findOne({ student: studentId, subject: subjectId, semester, academicYear })
        .populate({
            path: 'assessments.assessmentType',
            populate: {path: 'name', select: 'name'}
        });

    res.json({ success: true, data: grade }); 
  } catch (error) {
    console.error("Error fetching grade details:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a grade
// @route   DELETE /api/grades/:id
exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });

    if (req.user.role === 'admin') {
      return res.status(403).json({ message: "Admins cannot delete grade records." });
    }

    // ⚠️ የደህንነት ማሻሻያ፦ መምህሩ የዚህ ትምህርት ፈቃድ ያለው መሆኑን ማረጋገጥ
    const isAssigned = req.user.subjectsTaught && req.user.subjectsTaught.some(
        assignment => assignment.subject && assignment.subject.toString() === grade.subject.toString()
    );
    if (!isAssigned) {
        return res.status(403).json({ message: "You are not authorized to delete this grade record." });
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

    // ⚠️ የደህንነት ማሻሻያ፦ መምህሩ የዚህ ትምህርት ፈቃድ ያለው መሆኑን ማረጋገጥ
    const isAssigned = req.user.subjectsTaught && req.user.subjectsTaught.some(
        assignment => assignment.subject && assignment.subject.toString() === grade.subject.toString()
    );
    if (!isAssigned) {
        return res.status(403).json({ message: "You are not authorized to update this grade record." });
    }

    const { assessments } = req.body;
    if (!Array.isArray(assessments) || assessments.length === 0) {
      return res.status(400).json({ message: 'No assessments provided.' });
    }

    const assessmentTypeIds = assessments.map(a => a.assessmentType);
    const defs = await AssessmentType.find({ _id: { $in: assessmentTypeIds } });

    // ⚠️ ማስተካከያ፦ እዚህ ላይ የነበረው የ finalScore መደመሪያ ሎጂክ በሙሉ ጠፍቷል
    for (const a of assessments) {
      const def = defs.find(d => d._id.equals(a.assessmentType));
      if (!def) return res.status(400).json({ message: `Invalid assessmentType ID: ${a.assessmentType}` });
      if (a.score > def.totalMarks)
        return res.status(400).json({ message: `${def.name} score cannot exceed ${def.totalMarks}` });
    }

    grade.assessments = assessments;
    // ⚠️ finalScore በራስ-ሰር በ save Hook ይደመራል
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
    const assessmentType = await AssessmentType.findById(assessmentTypeId).populate('name', 'name');;
    if (!assessmentType) return res.status(404).json({ message: 'Assessment Type not found.' });

    const students = await Student.find({ gradeLevel: assessmentType.gradeLevel, status: 'Active' })
      .sort({ fullName: 1 })
      .select('fullName');

    const grades = await Grade.find({
      student: { $in: students.map(s => s._id) },
      'assessments.assessmentType': assessmentTypeId
    }).populate('assessments.assessmentType');

    const result = students.map(student => {
      const grade = grades.find(g => g.student.equals(student._id));
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
  try {
    const { subjectId, semester, academicYear } = req.body;

    if (!subjectId || !semester || !academicYear) {
      return res.status(400).json({ message: "Missing subject, semester, or academic year" });
    }

    // CASE A: By Assessment (1 Assessment, Multiple Students)
    if (req.body.assessmentTypeId && req.body.scores) {
      const { assessmentTypeId, scores } = req.body;

      // ⚠️ የደህንነት ማሻሻያ፦ የፈተናውን ወሰን (totalMarks) አስቀድሞ መፈለግ (ለቫሊዴሽን)
      const def = await AssessmentType.findById(assessmentTypeId);
      if (!def) return res.status(404).json({ message: "Assessment Type not found." });

      for (const item of scores) {
        if (item.score === null || item.score === undefined || item.score === '') continue;

        // ⚠️ ማስተካከያ፦ ውጤት ከጠቅላላ ፈተናው ነጥብ በላይ እንዳይሆን ቫሊዴት ማድረግ
        if (Number(item.score) > def.totalMarks) {
            return res.status(400).json({ message: `Score for student cannot exceed ${def.totalMarks}` });
        }

        let gradeDoc = await Grade.findOne({ student: item.studentId, subject: subjectId, semester, academicYear });

        if (!gradeDoc) {
          gradeDoc = new Grade({ student: item.studentId, subject: subjectId, semester, academicYear, assessments:[] });
        }

        const existingIndex = gradeDoc.assessments.findIndex(a => a.assessmentType && a.assessmentType.toString() === assessmentTypeId.toString());

        if (existingIndex > -1) {
          gradeDoc.assessments[existingIndex].score = Number(item.score);
        } else {
          gradeDoc.assessments.push({ assessmentType: assessmentTypeId, score: Number(item.score) });
        }

        gradeDoc.assessments = gradeDoc.assessments.filter(a => a.assessmentType);
        // ⚠️ finalScore በራስ-ሰር በ save Hook ይደመራል
        await gradeDoc.save(); 
      }

      return res.status(200).json({ success: true, message: "Grades saved successfully for multiple students" });
    }

    // CASE B: By Student (1 Student, Multiple Assessments)
    else if (req.body.studentId && req.body.assessments) {
      const { studentId, assessments } = req.body;

      let gradeDoc = await Grade.findOne({ student: studentId, subject: subjectId, semester, academicYear });

      if (!gradeDoc) {
        gradeDoc = new Grade({ student: studentId, subject: subjectId, semester, academicYear, assessments:[] });
      }

      const assessmentTypeIds = assessments.map(a => a.assessmentType);
      const defs = await AssessmentType.find({ _id: { $in: assessmentTypeIds } });

      for (const update of assessments) {
        if (update.score === null || update.score === undefined || update.score === '') continue;

        // ⚠️ ማስተካከያ፦ እዚህም ላይ የ totalMarks ቫሊዴሽን ጨምረናል
        const def = defs.find(d => d._id.equals(update.assessmentType));
        if (!def) return res.status(400).json({ message: `Invalid assessmentType ID: ${update.assessmentType}` });
        if (Number(update.score) > def.totalMarks) {
            return res.status(400).json({ message: `Score for ${def.name} cannot exceed ${def.totalMarks}` });
        }

        const existingIndex = gradeDoc.assessments.findIndex(a => a.assessmentType && a.assessmentType.toString() === update.assessmentType.toString());

        if (existingIndex > -1) {
          gradeDoc.assessments[existingIndex].score = Number(update.score);
        } else {
          gradeDoc.assessments.push({ assessmentType: update.assessmentType, score: Number(update.score) });
        }
      }

      gradeDoc.assessments = gradeDoc.assessments.filter(a => a.assessmentType);
      // ⚠️ finalScore በራስ-ሰር በ save Hook ይደመራል
      await gradeDoc.save();

      return res.status(200).json({ success: true, message: "Assessments saved successfully for student" });
    }

    else {
      return res.status(400).json({ message: "Invalid payload." });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error saving grades", error: error.message });
  }
};

// @route GET /api/grades/clean
exports.cleanBrokenAssessments = async (req, res) => {
  try {
    console.log("Starting System Cleanup...");

    const allGrades = await Grade.find()
      .populate('assessments.assessmentType')
      .populate('subject');

    let gradesDeleted = 0;
    let gradesFixed = 0;

    for (const grade of allGrades) {
      if (!grade.subject) {
        console.log(`CRITICAL: Grade ${grade._id} has no subject. Deleting.`);
        await grade.deleteOne(); 
        gradesDeleted++;
        continue;
      }

      const originalCount = grade.assessments.length;
      const validAssessments = grade.assessments.filter(a => a.assessmentType !== null);

      if (validAssessments.length < originalCount) {
        grade.assessments = validAssessments;
        // ⚠️ finalScore በራስ-ሰር በ save Hook ይደመራል
        await grade.save();
        gradesFixed++;
      }
    }

    if (gradesDeleted === 0 && gradesFixed === 0) {
      return res.status(200).json({ success: true, message: "System is clean. No errors found." });
    }

    res.status(200).json({
      success: true,
      message: `Cleanup Complete: Deleted ${gradesDeleted} and fixed ${gradesFixed} grade sheets.`
    });

  } catch (error) {
    console.error("Cleanup Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};