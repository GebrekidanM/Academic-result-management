const AssessmentName = require('../models/AssessmentName');

// @desc    Get all assessment names
// @route   GET /api/assessment-names
exports.getAllNames = async (req, res) => {
    try {
        const names = await AssessmentName.find({}).sort({ name: 1 });
        res.status(200).json({ success: true, data: names });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @desc    Create a new assessment name (Only Admin/Staff can create)
// @route   POST /api/assessment-names
exports.createName = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const exists = await AssessmentName.findOne({ name: name.trim() });
        if (exists) return res.status(400).json({ message: 'This assessment name already exists.' });

        const newName = await AssessmentName.create({ name: name.trim() });
        res.status(201).json({ success: true, data: newName });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};