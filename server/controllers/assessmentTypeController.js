const AssessmentType = require('../models/AssessmentType');
const Subject = require('../models/Subject');
const Grade = require('../models/Grade');

// @desc    Get all assessment types for a specific subject
// @route   GET /api/assessment-types?subjectId=...
exports.getAssessmentTypesBySubject = async (req, res) => {
    const { subjectId, semester } = req.query;

    if (!subjectId) {
        return res.status(400).json({ message: 'Subject ID is required' });
    }

    const filter = { subject: subjectId };
    if (semester) {
        filter.semester = semester;
    }

    try {
        // ⚠️ ማስተካከያ፦ የፈተናውን ስም በጽሁፍ ለማውጣት populate ተጨምሯል [2]
        const assessmentTypes = await AssessmentType.find(filter)
            .populate('name', 'name')
            .sort({ createdAt: 1 });

        res.status(200).json({ success: true, data: assessmentTypes });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a new assessment type
// @route   POST /api/assessment-types
exports.createAssessmentType = async (req, res) => {
    const { name, totalMarks, subjectId, gradeLevel, month, semester, year } = req.body;
    try {
        // 1. የኢትዮጵያ አመተ ምህረትን መፈተሽ (የወደፊት አመት እንዳይገባ መከልከል)
        const ethiopianYear = parseInt(new Intl.DateTimeFormat('en-US', { calendar: 'ethiopic', year: 'numeric' }).format(new Date()).replace(/\D/g, ''));
        if (Number(year) > ethiopianYear) {
            return res.status(400).json({ message: "You did not enter the correct year." });
        }

        // 2. ትምህርቱ (Subject) መኖሩን ማረጋገጥ
        const subject = await Subject.findById(subjectId);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        // 3. ለአንድ ትምህርት በዚያ ሴሚስተር ያሉትን የቆዩ ፈተናዎች መፈለግ
        const existingAssessments = await AssessmentType.find({
            subject: subjectId,
            gradeLevel,
            semester,
            year: String(year)
        });

        // የነባር ፈተናዎችን ጠቅላላ ውጤት መደመር
        const currentSum = existingAssessments.reduce((sum, at) => sum + at.totalMarks, 0);

        // የአሁኑ ሲደመር ከ 100 በላይ የሚሆን ከሆነ መከልከል
        if (currentSum + Number(totalMarks) > 100) {
            return res.status(400).json({ 
                message: `The cumulative total marks of all assessments for this subject cannot exceed 100. Current total is ${currentSum}/100. Adding this (${totalMarks}) would make it ${currentSum + Number(totalMarks)}/100.` 
            });
        }

        // 4. አዲሱን የፈተና አይነት በዳታቤዝ ውስጥ መፍጠር
        const assessmentType = await AssessmentType.create({
            name, 
            totalMarks: Number(totalMarks), 
            month, 
            semester,
            subject: subjectId,
            gradeLevel,
            year: String(year)
        });

        res.status(201).json({ success: true, data: assessmentType });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This exact assessment type already exists.' });
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

    // 1. የደህንነት ማሻሻያ፦ መምህሩ ለማዘመን ፈቃድ ያለው መሆኑን ማረጋገጥ
    const isAdmin = req.user.role === 'admin';
    const isAssignedTeacher = req.user.subjectsTaught && req.user.subjectsTaught.some(
        assignment => assignment.subject && assignment.subject.equals(assessmentType.subject)
    );

    if (!isAdmin && !isAssignedTeacher) {
        // ⚠️ ማስተካከያ፦ "res" እዚህ ላይ ተጨምሯል [1]
        return res.status(403).json({
            message: 'Forbidden: You are not authorized to update this assessment type.'
        });
    }

    // 2. subject እና gradeLevel እንዳይቀየሩ መከላከል
    if (req.body.subject || req.body.subjectId || req.body.gradeLevel) {
        return res.status(400).json({ message: "You cannot change the subject or grade level of an existing assessment type." });
    }

    // 3. ለማሻሻል የተላኩትን አዳዲስ እሴቶች መለየት (ካልተላኩ የድሮውን መያዝ)
    const newTotalMarks = req.body.totalMarks !== undefined ? Number(req.body.totalMarks) : assessmentType.totalMarks;
    const newSemester = req.body.semester || assessmentType.semester;
    const newYear = req.body.year ? String(req.body.year) : assessmentType.year;

    // 4. አዲሱ ቫሊዴሽን፦ ከራሱ ከሚሻሻለው ፈተና ውጪ ያሉትን ሌሎችን መፈለግ
    const otherAssessments = await AssessmentType.find({
        _id: { $ne: assessmentType._id }, // ራሱን ማግለል
        subject: assessmentType.subject,
        gradeLevel: assessmentType.gradeLevel,
        semester: newSemester,
        year: newYear
    });

    const currentSum = otherAssessments.reduce((sum, at) => sum + at.totalMarks, 0);

    // አዲሱ የተሻሻለው ውጤት ሲደመር ከ 100 በላይ የሚሆን ከሆነ መከልከል
    if (currentSum + newTotalMarks > 100) {
        return res.status(400).json({
            message: `The cumulative total marks of all assessments for this subject cannot exceed 100. Other assessments sum to ${currentSum}/100. Setting this to ${newTotalMarks} would make the total ${currentSum + newTotalMarks}/100.`
        });
    }

    const oldSemester = assessmentType.semester;
    const oldYear = assessmentType.year;

    // 5. አመተ ምህረቱ ከተላከ ወደ String መቀየሩን ማረጋገጥ
    if (req.body.year) {
        req.body.year = String(req.body.year);
    }

    // አፕዴት ማድረግ
    const updatedAssessmentType = await AssessmentType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // 6. CASCADE UPDATE: ሴሚስተር ወይም አመት ከተቀየረ የGrade ሰነዶችን ማጽዳት
    if (oldSemester !== newSemester || oldYear !== newYear) {
        console.log(`Cascade: Semester/Year changed. Cleaning up grades for AssessmentType: ${updatedAssessmentType._id}`);
        
        const affectedGrades = await Grade.find({
            "assessments.assessmentType": updatedAssessmentType._id
        });

        let gradesUpdated = 0;

        for (const grade of affectedGrades) {
            // የGrade ሰነዱ ሴሚስተር ወይም አመት ከፈተናው አዲስ ሴሚስተር/አመት ጋር የማይጣጣም ከሆነ ማስወገድ
            if (grade.semester !== newSemester || grade.academicYear !== newYear) {
                const originalLength = grade.assessments.length;
                
                grade.assessments = grade.assessments.filter(
                    (a) => a.assessmentType && !a.assessmentType.equals(updatedAssessmentType._id)
                );

                if (grade.assessments.length < originalLength) {
                    await grade.save(); // pre-save Hook በራሱ finalScoreን ያስተካክላል
                    gradesUpdated++;
                }
            }
        }
        console.log(`Cascade complete. Removed from ${gradesUpdated} mismatched Grade sheets.`);
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
exports.getAllAssessments = async (req,res)=>{
  const {year,semester} = req.query;

  try {
    // ⚠️ ማስተካከያ፦ የስሙን ኦብጀክት ሙሉ በሙሉ ለማግኘት populate ተጨምሯል [2]
    const assessmentTypes = await AssessmentType.find({year,semester})
      .populate('name', 'name');

      if (assessmentTypes) {
        // ⚠️ ማስተካከያ፦ ኖርማላይዝድ የሆነውን የስም እሴት (String) ተጠቅመን ዲዩፕሊኬት እናስወግዳለን [2]
        const uniqueAssessment = Array.from(
          new Map(assessmentTypes.map(ass => {
              const nameString = ass.name && typeof ass.name === 'object' ? ass.name.name : ass.name;
              return [nameString, ass];
          })).values()
        );
        return res.status(200).json(uniqueAssessment);
      }
  } catch(error) {
    res.status(500).json({'message':"server error"})
  }
}

// @desc    Delete an assessment type
// @route   DELETE /api/assessment-types/:id
exports.deleteAssessmentType = async (req, res) => {
    try {
        const assessmentType = await AssessmentType.findById(req.params.id);

        if (!assessmentType) {
            return res.status(404).json({ message: 'Assessment type not found' });
        }

        const isAdmin = req.user.role === 'admin';
        const isAssignedTeacher = req.user.subjectsTaught && req.user.subjectsTaught.some(
            assignment => assignment.subject && assignment.subject.equals(assessmentType.subject)
        );

        if (!isAdmin && !isAssignedTeacher) {
            return res.status(403).json({
                message: 'Forbidden: You are not authorized to delete this assessment type.'
            });
        }

        console.log(`Deleting Assessment Type: ${assessmentType.name} (${assessmentType._id})`);

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
            message: `Assessment type deleted. Updated ${gradesUpdated} student grade sheets.`
        });

    } catch (error) {
        console.error("Delete Assessment Type Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};