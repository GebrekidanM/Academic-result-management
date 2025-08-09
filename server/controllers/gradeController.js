const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const AssessmentType = require('../models/AssessmentType');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const webpush = require('web-push');

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
            .populate('subject', 'name gradeLevel')
            .populate('assessments.assessmentType');

        const allGrades = await gradesQuery;

        if (req.user?.role === 'admin') {
            return res.status(200).json({ success: true, count: allGrades.length, data: allGrades });
        }

        if (req.user?.role === 'teacher') {
            const teacherSubjectIds = new Set(
                req.user.subjectsTaught.map(assignment => assignment.subject._id.toString())
            );

            // Filter the grades array
            const filteredGrades = allGrades.filter(grade => 
                teacherSubjectIds.has(grade.subject._id.toString())
            );

            return res.status(200).json({ success: true, count: filteredGrades.length, data: filteredGrades });
        }
        
        res.status(200).json({ success: true, count: allGrades.length, data: allGrades });
        
    } catch (error) {
        console.error("Error fetching grades by student:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get a single grade document by student, subject, semester, and year
// @route   GET /api/grades/details?studentId=...&subjectId=...
exports.getGradeDetails = async (req, res) => {
    const { studentId, subjectId, semester, academicYear } = req.query;
    try {
        const grade = await Grade.findOne({ 
            student: studentId, 
            subject: subjectId,
            semester,
            academicYear
        });
        // It's okay if it's null, it just means no grades have been entered yet.
        res.json({ success: true, data: grade });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
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

// @desc    Update a grade entry and send notifications
// @route   PUT /api/grades/:id
exports.updateGrade = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id);
        if (!grade) {
            return res.status(404).json({ message: 'Grade record not found' });
        }
        
        // --- Security Check ---
        if (req.user.role === 'admin') {
            return res.status(403).json({ message: "Admins cannot alter grade records." });
        }
        // (In the future, you could add a check here to ensure only the assigned teacher can update)

        // --- Server-Side Recalculation (Your existing logic is perfect) ---
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

        // --- Update and Save the Document ---
        grade.assessments = assessments;
        grade.finalScore = newFinalScore;
        const updatedGrade = await grade.save();

        // =======================================================
        // --- DEFINITIVE NOTIFICATION TRIGGER LOGIC ---
        // =======================================================
        try {
            // We need to populate the necessary details for the message
            await updatedGrade.populate(['student', 'subject']);
            const student = updatedGrade.student;
            const subject = updatedGrade.subject;

            const message = `A grade record for ${student.fullName} in ${subject.name} (${grade.semester}) was updated.`;
            const link = `/students/${student._id}`;

            // 1. Identify ALL Recipients
            const recipients = new Map();
            const admins = await User.find({ role: 'admin' });
            admins.forEach(admin => recipients.set(admin._id.toString(), admin));
            const homeroomTeacher = await User.findOne({ homeroomGrade: student.gradeLevel });
            if (homeroomTeacher) {
                recipients.set(homeroomTeacher._id.toString(), homeroomTeacher);
            }

            // Exclude the person who made the change
            recipients.delete(req.user._id.toString());

            // 2. Send Notifications
            const io = req.app.get('socketio');
            const onlineUsers = req.app.get('onlineUsers');
            for (const recipient of recipients.values()) {
                await Notification.create({ recipient: recipient._id, message, link });
                const socketId = onlineUsers.get(recipient._id.toString());
                if (socketId) {
                    io.to(socketId).emit("getNotification", { message, link });
                }
                const subscriptions = await Subscription.find({ user: recipient._id });
                subscriptions.forEach(sub => {
                    const payload = JSON.stringify({ title: "Freedom School: Grade Update", body: message });
                    webpush.sendNotification(sub.subscriptionObject, payload).catch(err => console.error("Push Error:", err));
                });
            }
        } catch (notificationError) {
            console.error("Failed to send notifications on grade update:", notificationError);
        }
        // --- END OF NOTIFICATION LOGIC ---
        
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


// @desc    Update or insert multiple grades for a single assessment
// @route   POST /api/grades/sheet
exports.saveGradeSheet = async (req, res) => {
    const { assessmentTypeId, subjectId, semester, academicYear, scores } = req.body;
    
    // scores will be an array like: [{ studentId: '...', score: 85 }]
    if (!assessmentTypeId || !scores || !subjectId) {
        return res.status(400).json({ message: 'Missing required data.' });
    }
    
    try {
        for (const item of scores) {
            if (item.score === null || item.score === undefined || item.score === '') continue;

            let gradeDoc = await Grade.findOne({
                student: item.studentId,
                subject: subjectId,
                semester,
                academicYear
            });

            const scoreValue = Number(item.score);

            if (!gradeDoc) {
                gradeDoc = new Grade({
                    student: item.studentId, subject: subjectId, semester, academicYear,
                    assessments: [{ assessmentType: assessmentTypeId, score: scoreValue }],
                    finalScore: scoreValue 
                });
            } else {
                const assessmentIndex = gradeDoc.assessments.findIndex(a => a.assessmentType.equals(assessmentTypeId));
                
                if (assessmentIndex > -1) {
                    gradeDoc.assessments[assessmentIndex].score = scoreValue;
                } else {
                    gradeDoc.assessments.push({ assessmentType: assessmentTypeId, score: scoreValue });
                }
                gradeDoc.finalScore = gradeDoc.assessments.reduce((sum, a) => sum + a.score, 0);
            }
            await gradeDoc.save();
        }


        // --- Notification Logic ---
        try {
            const subject = await Subject.findById(subjectId);
            const assessmentType = await AssessmentType.findById(assessmentTypeId);
            const gradeLevel = subject.gradeLevel;
            const message = `Grades for "${assessmentType.name}" in ${subject.name} (${semester}) have been updated.`;
            const link = `/subject-roster`;
            
            const recipients = new Map();
            const admins = await User.find({ role: 'admin' });
            admins.forEach(admin => recipients.set(admin._id.toString(), admin));
            const homeroomTeacher = await User.findOne({ homeroomGrade: gradeLevel });
            if (homeroomTeacher) recipients.set(homeroomTeacher._id.toString(), homeroomTeacher);

            const io = req.app.get('socketio');
            const onlineUsers = req.app.get('onlineUsers');
            for (const recipient of recipients.values()) {
                await Notification.create({ recipient: recipient._id, message, link });
                const socketId = onlineUsers.get(recipient._id.toString());
                if (socketId) io.to(socketId).emit("getNotification", { message, link });

                const subscriptions = await Subscription.find({ user: recipient._id });
                subscriptions.forEach(sub => {
                    const payload = JSON.stringify({ title: "Freedom School: Grade Update", body: message });
                    webpush.sendNotification(sub.subscriptionObject, payload).catch(err => console.error("Push Error:", err));
                });
            }
        } catch (notificationError) {
            console.error("Notification Error from grade sheet save:", notificationError);
        }

        res.status(200).json({ message: "Grades saved successfully." });
    } catch (error) {
        res.status(500).json({ message: "Server error saving grades." });
    }
};
