// backend/controllers/assessmentTypeController.js
const AssessmentType = require('../models/AssessmentType');
const Subject = require('../models/Subject');
const Grade = require('../models/Grade');

// @desc    Get all assessment types for a specific subject
// @route   GET /api/assessment-types?subjectId=...
exports.getAssessmentTypesBySubject = async (req, res) => {
    // 1. We now also expect 'semester' as a query parameter
    const { subjectId, semester } = req.query;

    if (!subjectId) {
        return res.status(400).json({ message: 'Subject ID is required' });
    }
    
    // 2. Build the filter object dynamically
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
    // 1. Add 'semester' to the destructured body
    const { name, totalMarks, subjectId, gradeLevel, month, semester, year } = req.body;
    try {
        const subject = await Subject.findById(subjectId);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        
        const assessmentType = await AssessmentType.create({
            name, totalMarks, month, semester,
            subject: subjectId,
            gradeLevel,
            year
        });
        res.status(201).json({ success: true, data: assessmentType });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This exact assessment type already exists.' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAllAssessments = async (req,res)=>{
  const {year,semester} = req.query;

  try{
    const assessmentTypes = await AssessmentType.find({year,semester}).select('name')
      if(assessmentTypes){
        const uniqueAssessment = Array.from(
          new Map(assessmentTypes.map(ass=>[ass.name,ass])).values()
        )
        return res.status(202).json(uniqueAssessment) 
      }
  }catch(error){
    res.status(500).json({'message':"server error"})
  }
    
}

// @desc    Update an assessment type
// @route   PUT /api/assessment-types/:id
exports.updateAssessmentType = async (req, res) => {
  try {
    const updatedAssessmentType = await AssessmentType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedAssessmentType) {
      return res.status(404).json({ success: false, message: 'Assessment type not found.' });
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

        // --- PERMISSION CHECK ---
        const isAdmin = req.user.role === 'admin';
        const isAssignedTeacher = req.user.subjectsTaught.some(
            assignment => assignment.subject.equals(assessmentType.subject)
        );

        if (!isAdmin && !isAssignedTeacher) {
            return res.status(403).json({
                message: 'Forbidden: You are not authorized to delete this assessment type.'
            });
        }
        // --- END PERMISSION CHECK ---


        // 1️⃣ Find all grades that HAVE this assessment type BEFORE deleting it
        const affectedGrades = await Grade.find({
            "assessments.assessmentType": assessmentType._id
        });


        // 2️⃣ Remove the assessment type from all grades
        await Grade.updateMany(
            { "assessments.assessmentType": assessmentType._id },
            { $pull: { assessments: { assessmentType: assessmentType._id } } }
        );


        // 3️⃣ Recalculate finalScore for each affected grade
        for (const grade of affectedGrades) {

            // Remove from grade object
            grade.assessments = grade.assessments.filter(
                (a) => !a.assessmentType.equals(assessmentType._id)
            );

            // Recalculate final score
            grade.finalScore = grade.assessments.reduce(
                (sum, a) => sum + a.score,
                0
            );

            await grade.save();
        }


        // 4️⃣ Delete the assessment type itself
        await assessmentType.deleteOne();


        res.status(200).json({
            success: true,
            message: 'Assessment type deleted and grades updated successfully'
        });

    } catch (error) {
        console.error("Delete Assessment Type Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

