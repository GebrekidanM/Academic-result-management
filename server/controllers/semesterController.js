const Semester = require('../models/Semester');

// @desc    Get all semesters
// @route   GET /api/semesters
exports.getSemesters = async (req, res) => {
    try {
        const semesters = await Semester.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: semesters });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a semester
// @route   POST /api/semesters
exports.createSemester = async (req, res) => {
    try {
        const semester = await Semester.create(req.body);
        res.status(201).json({ success: true, data: semester });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update a semester
// @route   PUT /api/semesters/:id
exports.updateSemester = async (req, res) => {
    try {
        const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!semester) {
            return res.status(404).json({ success: false, message: 'Semester not found' });
        }
        res.status(200).json({ success: true, data: semester });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a semester
// @route   DELETE /api/semesters/:id
exports.deleteSemester = async (req, res) => {
    try {
        const semester = await Semester.findByIdAndDelete(req.params.id);
        if (!semester) {
            return res.status(404).json({ success: false, message: 'Semester not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
