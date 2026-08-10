const GradeLevel = require('../models/GradeLevel');

// @desc    Get all grade levels
// @route   GET /api/gradelevels
exports.getGradeLevels = async (req, res) => {
    try {
        const gradeLevels = await GradeLevel.find({}).sort({ name: 1 });
        res.status(200).json({ success: true, count: gradeLevels.length, data: gradeLevels });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single grade level by ID
// @route   GET /api/gradelevels/:id
exports.getGradeLevelById = async (req, res) => {
    try {
        const gradeLevel = await GradeLevel.findById(req.params.id);
        if (!gradeLevel) {
            return res.status(404).json({ success: false, message: 'Grade level not found' });
        }
        res.status(200).json({ success: true, data: gradeLevel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new grade level
// @route   POST /api/gradelevels
exports.createGradeLevel = async (req, res) => {
    try {
        const { name, schoolLevel, roomNumber, capacity } = req.body;
        const gradeLevel = await GradeLevel.create({
            name: name.trim(),
            schoolLevel,
            roomNumber: roomNumber ? roomNumber.trim() : '',
            capacity: capacity || 40
        });

        res.status(201).json({ success: true, data: gradeLevel });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A class with this name already exists.' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update grade level
// @route   PUT /api/gradelevels/:id
exports.updateGradeLevel = async (req, res) => {
    try {
        const gradeLevel = await GradeLevel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!gradeLevel) {
            return res.status(404).json({ success: false, message: 'Grade level not found' });
        }
        res.status(200).json({ success: true, data: gradeLevel });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete grade level
// @route   DELETE /api/gradelevels/:id
exports.deleteGradeLevel = async (req, res) => {
    try {
        const gradeLevel = await GradeLevel.findById(req.params.id);
        if (!gradeLevel) {
            return res.status(404).json({ success: false, message: 'Grade level not found' });
        }

        await gradeLevel.deleteOne();
        res.status(200).json({ success: true, message: 'Grade level deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};