// server/controllers/assessmentTypeController.js
const mongoose = require('mongoose');
const AssessmentType = require('../models/AssessmentType');
const Subject = require('../models/Subject');
const Grade = require('../models/Grade');
const GradeLevel = require('../models/GradeLevel');

// @desc    Get all assessment types for a specific subject & grade level
// @route   GET /api/assessment-types?subjectId=...&gradeLevel=...&semester=...
exports.getAssessmentTypesBySubject = async (req, res) => {
    let { subjectId, semester, gradeLevel } = req.query;

    if (!subjectId) {
        return res.status(400).json({ message: 'Subject ID is required' });
    }

    try {
        // SAFEGUARD: If semester parameter was passed as a 24-char ObjectId, re-assign to gradeLevel
        if (semester && mongoose.Types.ObjectId.isValid(semester) && semester.length === 24 && !gradeLevel) {
            gradeLevel = semester;
            semester = null;
        }

        // 1. RESOLVE SUBJECT OBJECTID
        let targetSubjectId = null;
        if (mongoose.Types.ObjectId.isValid(subjectId) && subjectId.length === 24) {
            targetGradeId = new mongoose.Types.ObjectId(subjectId);
            targetSubjectId = subjectId;
        } else {
            const sDoc = await Subject.findOne({ name: subjectId }).collation({ locale: 'en', strength: 2 });
            if (sDoc) targetSubjectId = sDoc._id;
        }

        const filter = { subject: targetSubjectId || subjectId };

        if (semester) {
            filter.semester = semester;
        }

        // 2. RESOLVE GRADE LEVEL OBJECTID (Ensures NO plain string like "Grade 1A" is passed to Mongoose)
        if (gradeLevel) {
            let targetGradeId = null;

            if (mongoose.Types.ObjectId.isValid(gradeLevel) && gradeLevel.length === 24) {
                targetGradeId = new mongoose.Types.ObjectId(gradeLevel);
            } else {
                const gDoc = await GradeLevel.findOne({ name: gradeLevel }).collation({ locale: 'en', strength: 2 });
                if (gDoc) targetGradeId = gDoc._id;
            }

            if (targetGradeId) {
                filter.gradeLevel = targetGradeId; // Pure ObjectId only
            }
        }

        console.log("\n================ 🔍 ASSESSMENT TYPE QUERY DEBUG ================");
        console.log("MongoDB Filter Used  :", JSON.stringify(filter, null, 2));

        const assessmentTypes = await AssessmentType.find(filter)
            .populate('name', 'name')
            .sort({ createdAt: 1 });

        console.log(`Results Found Count  : ${assessmentTypes.length}`);
        console.log("=================================================================\n");

        res.status(200).json({ success: true, data: assessmentTypes });

    } catch (error) {
        console.error("Error fetching assessment types:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a new assessment type
// @route   POST /api/assessment-types
exports.createAssessmentType = async (req, res) => {
    const { name, totalMarks, subjectId, subject, gradeLevel, month, semester, year } = req.body;
    const targetSubjectId = subjectId || subject;

    if (!name || !targetSubjectId || !gradeLevel) {
        return res.status(400).json({ message: 'Assessment Name, Subject, and Grade Level are required.' });
    }

    try {
        let targetGradeId = gradeLevel;
        if (typeof gradeLevel === 'string' && !mongoose.Types.ObjectId.isValid(gradeLevel)) {
            const gDoc = await GradeLevel.findOne({ name: gradeLevel }).collation({ locale: 'en', strength: 2 });
            if (gDoc) targetGradeId = gDoc._id;
        }

        const subjectDoc = await Subject.findById(targetSubjectId);
        if (!subjectDoc) return res.status(404).json({ message: 'Subject not found' });

        const existingAssessments = await AssessmentType.find({
            subject: targetSubjectId,
            gradeLevel: targetGradeId,
            semester,
            year: String(year)
        });

        // Sum current total marks
        const currentSum = existingAssessments.reduce((sum, at) => sum + at.totalMarks, 0);
        // Enforce 100 max cumulative mark limit
        if (currentSum + Number(totalMarks) > 100) {
            return res.status(400).json({ 
                message: `Cumulative total marks for this subject cannot exceed 100. Current total is ${currentSum}/100. Adding this (${totalMarks}) would make it ${currentSum + Number(totalMarks)}/100.` 
            });
        }

        const assessmentType = await AssessmentType.create({
            name, 
            totalMarks: Number(totalMarks), 
            month, 
            semester,
            subject: targetSubjectId,
            gradeLevel: targetGradeId,
            year: String(year)
        });


        // Return populated 'name' object for immediate frontend rendering
        const populatedAssessment = await AssessmentType.findById(assessmentType._id)
            .populate('name', 'name');

        res.status(201).json({ success: true, data: populatedAssessment });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This exact assessment type already exists for this subject, month, and semester.' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update an assessment type
// @route   PUT /api/assessment-types/:id
exports.updateAssessmentType = async (req, res) => {
  try {
    const assessmentType = await AssessmentType.findById(req.params.id);
    if (!assessmentType) {
      return res.status(404).json({ success: false, message: 'Assessment type not found.' });
    }

    // 1. Authorization check
    const isAdmin = req.user.role === 'admin' || req.user.role === 'staff';
    const isAssignedTeacher = req.user.subjectsTaught && req.user.subjectsTaught.some(
        assignment => assignment.subject && assignment.subject.equals(assessmentType.subject)
    );

    if (!isAdmin && !isAssignedTeacher) {
        return res.status(403).json({
            message: 'Forbidden: You are not authorized to update this assessment type.'
        });
    }

    // 2. Prevent changing subject or gradeLevel
    if (req.body.subject || req.body.subjectId || req.body.gradeLevel) {
        return res.status(400).json({ message: "You cannot change the subject or grade level of an existing assessment type." });
    }

    // 3. Extract new values
    const newTotalMarks = req.body.totalMarks !== undefined ? Number(req.body.totalMarks) : assessmentType.totalMarks;
    const newSemester = req.body.semester || assessmentType.semester;
    const newYear = req.body.year ? String(req.body.year) : assessmentType.year;

    // 4. Validate cumulative marks excluding current item
    const otherAssessments = await AssessmentType.find({
        _id: { $ne: assessmentType._id },
        subject: assessmentType.subject,
        gradeLevel: assessmentType.gradeLevel,
        semester: newSemester,
        year: newYear
    });

    const currentSum = otherAssessments.reduce((sum, at) => sum + at.totalMarks, 0);

    if (currentSum + newTotalMarks > 100) {
        return res.status(400).json({
            message: `Cumulative total marks cannot exceed 100. Other assessments sum to ${currentSum}/100. Setting this to ${newTotalMarks} would make the total ${currentSum + newTotalMarks}/100.`
        });
    }

    const oldSemester = assessmentType.semester;
    const oldYear = assessmentType.year;

    if (req.body.year) {
        req.body.year = String(req.body.year);
    }

    const updatedAssessmentType = await AssessmentType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('name', 'name');

    // 5. CASCADE UPDATE: Clean up mismatched Grade sheets if semester/year changed
    if (oldSemester !== newSemester || oldYear !== newYear) {
        const affectedGrades = await Grade.find({
            "assessments.assessmentType": updatedAssessmentType._id
        });

        let gradesUpdated = 0;

        for (const grade of affectedGrades) {
            if (grade.semester !== newSemester || grade.academicYear !== newYear) {
                const originalLength = grade.assessments.length;
                
                grade.assessments = grade.assessments.filter(
                    (a) => a.assessmentType && !a.assessmentType.equals(updatedAssessmentType._id)
                );

                if (grade.assessments.length < originalLength) {
                    await grade.save();
                    gradesUpdated++;
                }
            }
        }
    }

    res.status(200).json({
      success: true,
      message: 'Assessment type updated successfully.',
      data: updatedAssessmentType,
    });
  } catch (error) {
    console.error('Error updating assessment type:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all assessments (Unique names)
// @route   GET /api/assessment-types/all
exports.getAllAssessments = async (req, res) => {
  const { year, semester } = req.query;

  try {
    const filter = {};
    if (year) filter.year = String(year);
    if (semester) filter.semester = semester;

    const assessmentTypes = await AssessmentType.find(filter)
      .populate('name', 'name');

    if (assessmentTypes) {
        const uniqueAssessment = Array.from(
          new Map(assessmentTypes.map(ass => {
              const nameString = ass.name && typeof ass.name === 'object' ? ass.name.name : ass.name;
              return [nameString, ass];
          })).values()
        );
        return res.status(200).json(uniqueAssessment);
    }
    res.status(200).json([]);
  } catch(error) {
    res.status(500).json({ message: "Server error fetching assessments", details: error.message });
  }
};

// @desc    Delete an assessment type
// @route   DELETE /api/assessment-types/:id
exports.deleteAssessmentType = async (req, res) => {
    try {
        const assessmentType = await AssessmentType.findById(req.params.id);

        if (!assessmentType) {
            return res.status(404).json({ message: 'Assessment type not found' });
        }

        const isAdmin = req.user.role === 'admin' || req.user.role === 'staff';
        const isAssignedTeacher = req.user.subjectsTaught && req.user.subjectsTaught.some(
            assignment => assignment.subject && assignment.subject.equals(assessmentType.subject)
        );

        if (!isAdmin && !isAssignedTeacher) {
            return res.status(403).json({
                message: 'Forbidden: You are not authorized to delete this assessment type.'
            });
        }

        // Cascade delete: Remove this assessment type from all student Grade sheets
        const affectedGrades = await Grade.find({
            "assessments.assessmentType": assessmentType._id
        });

        let gradesUpdated = 0;

        for (const grade of affectedGrades) {
            const originalLength = grade.assessments.length;

            grade.assessments = grade.assessments.filter(
                (a) => a.assessmentType && !a.assessmentType.equals(assessmentType._id)
            );

            if (grade.assessments.length < originalLength) {
                await grade.save();
                gradesUpdated++;
            }
        }

        await assessmentType.deleteOne();

        res.status(200).json({
            success: true,
            message: `Assessment type deleted successfully. Cleaned up ${gradesUpdated} student grade sheets.`
        });

    } catch (error) {
        console.error("Delete Assessment Type Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};