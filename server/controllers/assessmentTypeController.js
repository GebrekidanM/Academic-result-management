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
        const assessmentTypes = await AssessmentType.find(filter).sort({ createdAt: 1 });
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
        const ethiopianYear = parseInt(new Intl.DateTimeFormat('en-US', { calendar: 'ethiopic', year: 'numeric' }).format(new Date()).replace(/\D/g, ''));
        if(Number(year) > ethiopianYear){
            return res.status(400).json({message: "You did not enter the correct year."})
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const assessmentType = await AssessmentType.create({
            name, totalMarks, month, semester,
            subject: subjectId,
            gradeLevel,
            year: String(year) // ⚠️ የአካዳሚክ አመቱን ወደ String ቀይረነዋል
        });
        res.status(201).json({ success: true, data: assessmentType });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This exact assessment type already exists.' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all assessments (Unique names)
exports.getAllAssessments = async (req,res)=>{
  const {year,semester} = req.query;

  try{
    const assessmentTypes = await AssessmentType.find({year,semester}).select('name')
      if(assessmentTypes){
        const uniqueAssessment = Array.from(
          new Map(assessmentTypes.map(ass=>[ass.name,ass])).values()
        )
        return res.status(200).json(uniqueAssessment); // ⚠️ HTTP Status ወደ 200 ተቀይሯል
      }
  }catch(error){
    res.status(500).json({'message':"server error"})
  }
}

// @desc    Update an assessment type
// @route   PUT /api/assessment-types/:id
// @desc    Update an assessment type
// @route   PUT /api/assessment-types/:id
exports.updateAssessmentType = async (req, res) => {
  try {
    const assessmentType = await AssessmentType.findById(req.params.id);
    if (!assessmentType) {
      return res.status(404).json({ success: false, message: 'Assessment type not found.' });
    }

    // --- PERMISSION CHECK ---
    const isAdmin = req.user.role === 'admin';
    const isAssignedTeacher = req.user.subjectsTaught && req.user.subjectsTaught.some(
        assignment => assignment.subject && assignment.subject.equals(assessmentType.subject)
    );

    if (!isAdmin && !isAssignedTeacher) {
        return res.status(403).json({
            message: 'Forbidden: You are not authorized to update this assessment type.'
        });
    }

    // subject እና gradeLevel እንዳይቀየሩ መከላከል
    if (req.body.subject || req.body.gradeLevel) {
        return res.status(400).json({ message: "You cannot change the subject or grade level of an existing assessment type." });
    }

    const oldSemester = assessmentType.semester;
    const oldYear = assessmentType.year;

    // አፕዴት ማድረግ
    const updatedAssessmentType = await AssessmentType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    const newSemester = updatedAssessmentType.semester;
    const newYear = updatedAssessmentType.year;

    // ⚠️ CASCADE UPDATE: ሴሚስተር ወይም አመት ከተቀየረ የGrade ሰነዶችን ማጽዳት
    if (oldSemester !== newSemester || oldYear !== newYear) {
        console.log(`Cascade: Semester/Year changed. Cleaning up grades for AssessmentType: ${updatedAssessmentType._id}`);
        
        // ይህ ፈተና ያለባቸውን ሁሉንም የGrade ሰነዶች መፈለግ
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
                // ⚠️ finalScore በራስ-ሰር በ save Hook ይደመራል (መደመሪያ ሎጂኩ ተወግዷል)
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