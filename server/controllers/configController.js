const GlobalConfig = require('../models/GlobalConfig');

// @desc    Get global configuration
// @route   GET /api/config
exports.getConfig = async (req, res) => {
    try {
        let config = await GlobalConfig.findOne();
        if (!config) {
            config = await GlobalConfig.create({});
        }
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error('Config fetch error:', error);
        res.status(500).json({ success: false, message: 'Database connection error', details: error.message });
    }
};

// @desc    Update global configuration
// @route   PUT /api/config
exports.updateConfig = async (req, res) => {
    try {
        let config = await GlobalConfig.findOne();
        if (!config) {
            config = await GlobalConfig.create(req.body);
        } else {
            config = await GlobalConfig.findByIdAndUpdate(config._id, req.body, {
                new: true,
                runValidators: true
            });
        }
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
