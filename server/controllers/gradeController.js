// controllers/gradeController.js
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const AssessmentType = require('../models/AssessmentType');

// @desc    Add a new grade entry
// @route   POST /api/grades
exports.addGrade = async (req, res) => {
    const { studentId, subjectId, academicYear, semester, assessments } = req.body;

    if (req.user.role === 'admin') {
            return res.status(403).json({ message: "Forbidden: Admins can view data but cannot modify grade records." });
        }

    try {
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        const subject = await Subject.findById(subjectId);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        let finalScore = 0;
        if (assessments && assessments.length > 0) {
            const assessmentTypeIds = assessments.map(a => a.assessmentType);
            const assessmentTypeDefs = await AssessmentType.find({ '_id': { $in: assessmentTypeIds } });
            
            for (const assessment of assessments) {
                const def = assessmentTypeDefs.find(d => d._id.equals(assessment.assessmentType));
                if (!def) {
                    return res.status(400).json({ message: `Invalid assessmentType ID: ${assessment.assessmentType}` });
                }
                // Validate that the score is not higher than the total marks
                if (Number(assessment.score) > def.totalMarks) {
                    return res.status(400).json({ message: `Score for ${def.name} cannot be higher than ${def.totalMarks}.` });
                }
                finalScore += Number(assessment.score);
            }
        }

        // --- THIS IS THE CORRECTED CREATE CALL ---
        const grade = await Grade.create({
            student: studentId,
            subject: subjectId,
            academicYear,
            semester,
            assessments,
            finalScore: finalScore // We now correctly pass the calculated finalScore
        });

        res.status(201).json({ success: true, data: grade });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A grade for this student in this subject and semester already exists. Please edit the existing grade.' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get a single grade by its ID
// @route   GET /api/grades/:id
exports.getGradeById = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id).populate('subject', 'name');
        if (!grade) {
            return res.status(404).json({ message: 'Grade not found' });
        }
        res.status(200).json({ success: true, data: grade });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get all grades (with student and subject details)
// @route   GET /api/grades
exports.getGrades = async (req, res) => {
    try {
        const grades = await Grade.find({})
            .populate('student', 'fullName studentId') // Populate with student's name and ID
            .populate('subject', 'name'); // Populate with subject's name

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
        
        // Find all grades for the student
        let gradesQuery = Grade.find({ student: studentId })
            .populate('subject', 'name gradeLevel') // Always populate the subject details
            .populate('assessments.assessmentType'); // Also populate assessment details

        const allGrades = await gradesQuery;

        // --- THE CRITICAL PERMISSION FILTER ---
        // If the user is an admin, they can see all grades.
        if (req.user.role === 'admin') {
            return res.status(200).json({ success: true, count: allGrades.length, data: allGrades });
        }

        // If the user is a teacher, filter the grades to show only those for subjects they teach.
        if (req.user.role === 'teacher') {
            // Get a list of the subject IDs the teacher is assigned to.
            const teacherSubjectIds = new Set(
                req.user.subjectsTaught.map(assignment => assignment.subject._id.toString())
            );

            // Filter the grades array
            const filteredGrades = allGrades.filter(grade => 
                teacherSubjectIds.has(grade.subject._id.toString())
            );

            return res.status(200).json({ success: true, count: filteredGrades.length, data: filteredGrades });
        }
        
        // If the user is not an admin or a teacher (e.g., a parent), they should not use this route.
        // Or, we could add logic for parents here if needed. For now, we assume this is a staff route.
        // The canViewStudentData middleware already protects this.

        res.status(200).json({ success: true, count: allGrades.length, data: allGrades });
        
    } catch (error) {
        console.error("Error fetching grades by student:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.deleteGrade = async (req, res) => {
    const grade = await Grade.findById(req.params.id);

     if (req.user.role === 'admin') {
        return res.status(403).json({ message: "Forbidden: Admins can view data but cannot modify grade records." });
    }
    
    if (!grade) {
        return res.status(404).json({ message: 'Grade not found' });
    }
    await grade.deleteOne();
    res.status(200).json({ success: true, message: 'Grade deleted' });
};

// @desc    Update a grade entry
// @route   PUT /api/grades/:id
exports.updateGrade = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id);

        if (!grade) {
            return res.status(404).json({ message: 'Grade record not found' });
        }
        
        if (req.user.role === 'admin') {
            return res.status(403).json({ message: "Admins cannot alter grade records." });
        }

        // --- Recalculate the finalScore on the server ---
        const { assessments } = req.body;
        let newFinalScore = 0;
        if (assessments && assessments.length > 0) {
            const assessmentTypeIds = assessments.map(a => a.assessmentType);
            const assessmentTypeDefs = await AssessmentType.find({ '_id': { $in: assessmentTypeIds } });

            for (const assessment of assessments) {
                const def = assessmentTypeDefs.find(d => d._id.equals(assessment.assessmentType));
                if (!def) return res.status(400).json({ message: `Invalid assessmentType ID: ${assessment.assessmentType}` });
                if (Number(assessment.score) > def.totalMarks) {
                    return res.status(400).json({ message: `Score for ${def.name} cannot exceed ${def.totalMarks}.` });
                }
                newFinalScore += Number(assessment.score);
            }
        }

        // Update the document
        grade.assessments = assessments;
        grade.finalScore = newFinalScore;

        const updatedGrade = await grade.save();
        res.status(200).json({ success: true, data: updatedGrade });

    } catch (error) {
        console.error("Error updating grade:", error);
        res.status(500).json({ message: "Server error while updating grade." });
    }
};



// @desc    Get a list of students and their scores for a specific assessment
// @route   GET /api/grades/sheet?assessmentTypeId=...
exports.getGradeSheet = async (req, res) => {
    const { assessmentTypeId } = req.query;
    if (!assessmentTypeId) return res.status(400).json({ message: 'Assessment Type ID is required.' });

    try {
        const assessmentType = await AssessmentType.findById(assessmentTypeId);
        if (!assessmentType) return res.status(404).json({ message: 'Assessment Type not found.' });
        
        const students = await Student.find({ gradeLevel: assessmentType.gradeLevel, status: 'Active' }).sort({ fullName: 1 });
        const studentIds = students.map(s => s._id);

        const grades = await Grade.find({ 
            student: { $in: studentIds },
            'assessments.assessmentType': assessmentTypeId
        });

        const sheetData = students.map(student => {
            const gradeDoc = grades.find(g => g.student.equals(student._id));
            let currentScore = null;
            if (gradeDoc) {
                const assessment = gradeDoc.assessments.find(a => a.assessmentType.equals(assessmentTypeId));
                if (assessment) currentScore = assessment.score;
            }
            return {
                _id: student._id,
                fullName: student.fullName,
                score: currentScore
            };
        });

        res.json({ assessmentType, students: sheetData });
    } catch (error) {
        res.status(500).json({ message: "Server error fetching grade sheet." });
    }
};


// --- 2. አዲስ ተግባር: የቡድን ውጤቶችን ለማስቀመጥ ---
// @desc    Update or insert multiple grades for a single assessment
// @route   POST /api/grades/sheet
exports.saveGradeSheet = async (req, res) => {
    const { assessmentTypeId, subjectId, semester, academicYear, scores } = req.body;
    
    // scores will be an array like: [{ studentId: '...', score: 85 }]
    if (!assessmentTypeId || !scores || !subjectId) {
        return res.status(400).json({ message: 'Missing required data.' });
    }
    
    try {
        const bulkOps = scores.map(item => {
            const studentId = item.studentId;
            const score = Number(item.score);

            return {
                updateOne: {
                    filter: { 
                        student: studentId, 
                        subject: subjectId,
                        semester: semester,
                        academicYear: academicYear,
                        'assessments.assessmentType': assessmentTypeId 
                    },
                    update: { 
                        $set: { 'assessments.$.score': score }
                    }
                }
            };
        });

        // This is a complex operation that needs refinement. 
        // For now, let's use a simpler loop.
        for (const item of scores) {
            let gradeDoc = await Grade.findOne({
                student: item.studentId,
                subject: subjectId,
                semester,
                academicYear
            });

            if (!gradeDoc) { // If no grade document exists for this student/subject/semester
                gradeDoc = new Grade({
                    student: item.studentId, subject: subjectId, semester, academicYear,
                    assessments: [{ assessmentType: assessmentTypeId, score: item.score }],
                    finalScore: item.score // Initial final score
                });
            } else { // If it exists, update the assessment
                const assessmentIndex = gradeDoc.assessments.findIndex(a => a.assessmentType.equals(assessmentTypeId));
                if (assessmentIndex > -1) {
                    gradeDoc.assessments[assessmentIndex].score = item.score;
                } else {
                    gradeDoc.assessments.push({ assessmentType: assessmentTypeId, score: item.score });
                }
                // Recalculate final score
                gradeDoc.finalScore = gradeDoc.assessments.reduce((sum, a) => sum + a.score, 0);
            }
            await gradeDoc.save();
        }

        res.status(200).json({ message: "Grades saved successfully." });

    } catch (error) {
        console.error("Error saving grade sheet:", error);
        res.status(500).json({ message: "Server error saving grades." });
    }
};
