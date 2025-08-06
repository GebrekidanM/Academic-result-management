// controllers/behavioralReportController.js
const BehavioralReport = require('../models/BehavioralReport');
const Student = require('../models/Student');

// @desc    Add a behavioral report
// @route   POST /api/reports
exports.addReport = async (req, res) => {
    try {
        const { studentId, academicYear, semester, evaluations, teacherComment, conduct } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const report = await BehavioralReport.create({
            student: studentId,
            academicYear,
            semester,
            evaluations,
            teacherComment,
            createdBy: req.user._id,
            conduct
        });

        try {
            const student = await Student.findById(studentId);
            const message = `A new behavioral report for the ${semester} has been added for ${student.fullName}.`;
            const link = `/parent/dashboard`; // Link to their dashboard

            // In the future, we would find the parent's User account. For now,
            // we will simulate this by creating a notification for the student's own ID,
            // as our Parent Portal login is tied to the student.
            const recipientId = student._id; // This is the key

            // Send In-App Notification (this requires a Parent/Student socket connection)
            // We will add this to server.js next.
            const io = req.app.get('socketio');
            const onlineUsers = req.app.get('onlineUsers');
            const socketId = onlineUsers.get(recipientId.toString());
            if (socketId) {
                io.to(socketId).emit("getNotification", { message, link });
            }

            // In the future, you could also send a Push Notification or Email here.

        } catch (notificationError) {
            console.error("Failed to send parent notification:", notificationError);
        }
        res.status(201).json({ success: true, data: report });
    } catch (error) {
        // Handle the unique index error gracefully
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A behavioral report for this student already exists for this semester.' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.getReportById = async (req, res) => {
    try {
        const report = await BehavioralReport.findById(req.params.reportId);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get reports for a specific student
// @route   GET /api/reports/student/:studentId
exports.getReportsByStudent = async (req, res) => {
    try {
        const reports = await BehavioralReport.find({ student: req.params.studentId })
            .populate('createdBy', 'fullName')
            .sort({ academicYear: -1, semester: -1 }); // Show newest first

        res.status(200).json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a specific report
// @route   PUT /api/reports/:reportId
exports.updateReport = async (req, res) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({ message: "Forbidden: Admins can view reports but cannot alter them." });
    }

    try {
        const updatedReport = await BehavioralReport.findByIdAndUpdate(req.params.reportId, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedReport) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.status(200).json({ success: true, data: updatedReport });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a report
// @route   DELETE /api/reports/:reportId
exports.deleteReport = async (req, res) => {
    if (req.user.role === 'admin') {
        return res.status(403).json({ message: "Forbidden: Admins can view reports but cannot alter them." });
    }
    
    try {
        // Use the parameter name you defined in the route (e.g., req.params.reportId)
        const report = await BehavioralReport.findById(req.params.reportId);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        // Optional: Check if the user deleting the report is authorized to do so
        
        await report.deleteOne();

        res.status(200).json({ success: true, message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
