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
