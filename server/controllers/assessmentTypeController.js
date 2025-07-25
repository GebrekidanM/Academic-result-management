// backend/controllers/assessmentTypeController.js
const AssessmentType = require('../models/AssessmentType');
const Subject = require('../models/Subject');

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
    const { name, totalMarks, subjectId, gradeLevel, month, semester } = req.body;
    try {
        const subject = await Subject.findById(subjectId);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        
        const assessmentType = await AssessmentType.create({
            name, totalMarks, month, semester, // 2. Add 'semester' to the create call
            subject: subjectId,
            gradeLevel
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
            return res.status(404).json({ message: 'Assessment type not found' });
        }

        // --- THE DEFINITIVE PERMISSION CHECK ---
        const isAdmin = req.user.role === 'admin';
        const isAssignedTeacher = req.user.subjectsTaught.some(
            assignment => assignment.subject.equals(assessmentType.subject)
        );
        if (!isAdmin && !isAssignedTeacher) {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to modify this assessment type.' });
        }
        // --- END OF CHECK ---

        const updatedAssessmentType = await AssessmentType.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: updatedAssessmentType });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
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

        // --- THE DEFINITIVE PERMISSION CHECK ---
        const isAdmin = req.user.role === 'admin';
        const isAssignedTeacher = req.user.subjectsTaught.some(
            assignment => assignment.subject.equals(assessmentType.subject)
        );
        if (!isAdmin && !isAssignedTeacher) {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this assessment type.' });
        }
        // --- END OF CHECK ---

        await assessmentType.deleteOne();
        res.status(200).json({ success: true, message: 'Assessment type deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
