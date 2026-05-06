const Class = require('../models/Class');
const Stream = require('../models/Stream');

// @desc    Create a new class
// @route   POST /api/classes
exports.createClass = async (req, res) => {
    try {
        const { className, schoolLevel } = req.body;
        const cls = await Class.create({ className, schoolLevel });
        res.status(201).json({ success: true, data: cls });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all classes
// @route   GET /api/classes
exports.getClasses = async (req, res) => {
    try {
        const classes = await Class.find().sort({ className: 1 });
        res.status(200).json({ success: true, count: classes.length, data: classes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a class
// @route   PUT /api/classes/:id
exports.updateClass = async (req, res) => {
    try {
        const cls = await Class.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
        res.status(200).json({ success: true, data: cls });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
exports.deleteClass = async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id);
        if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
        
        // Also delete associated streams
        await Stream.deleteMany({ classId: cls._id });
        await cls.deleteOne();
        
        res.status(200).json({ success: true, message: 'Class and associated streams deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- STREAM METHODS ---

// @desc    Create a new stream
// @route   POST /api/classes/:classId/streams
exports.createStream = async (req, res) => {
    try {
        const { streamName } = req.body;
        const stream = await Stream.create({ streamName, classId: req.params.classId });
        res.status(201).json({ success: true, data: stream });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get streams for a specific class
// @route   GET /api/classes/:classId/streams
exports.getStreamsByClass = async (req, res) => {
    try {
        const streams = await Stream.find({ classId: req.params.classId }).sort({ streamName: 1 });
        res.status(200).json({ success: true, count: streams.length, data: streams });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a stream
// @route   PUT /api/streams/:id
exports.updateStream = async (req, res) => {
    try {
        const stream = await Stream.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!stream) return res.status(404).json({ success: false, message: 'Stream not found' });
        res.status(200).json({ success: true, data: stream });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a stream
// @route   DELETE /api/streams/:id
exports.deleteStream = async (req, res) => {
    try {
        const stream = await Stream.findByIdAndDelete(req.params.id);
        if (!stream) return res.status(404).json({ success: false, message: 'Stream not found' });
        res.status(200).json({ success: true, message: 'Stream deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
