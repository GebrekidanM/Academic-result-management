const GradingScale = require('../models/GradingScale');

const getApplicableGradingScale = async (className) => {
    const scale = await GradingScale.findOne({
        isActive: true,
        applicableClasses: className
    });
    return scale;
};

const getGradeFromScore = async (score, className) => {
    const scale = await getApplicableGradingScale(className);
    if (!scale) return '-';
    
    for (const range of scale.ranges) {
        if (score >= range.minScore && score <= range.maxScore) {
            return range.grade;
        }
    }
    return '-';
};

const getAllGradingScales = async (req, res) => {
    try {
        const scales = await GradingScale.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: scales });
    } catch (error) {
        console.error('Error fetching grading scales:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getGradingScaleById = async (req, res) => {
    try {
        const scale = await GradingScale.findById(req.params.id);
        if (!scale) {
            return res.status(404).json({ success: false, message: 'Grading scale not found' });
        }
        res.status(200).json({ success: true, data: scale });
    } catch (error) {
        console.error('Error fetching grading scale:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const createGradingScale = async (req, res) => {
    try {
        const scale = new GradingScale(req.body);
        await scale.save();
        res.status(201).json({ success: true, data: scale });
    } catch (error) {
        console.error('Error creating grading scale:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const updateGradingScale = async (req, res) => {
    try {
        const scale = await GradingScale.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!scale) {
            return res.status(404).json({ success: false, message: 'Grading scale not found' });
        }
        res.status(200).json({ success: true, data: scale });
    } catch (error) {
        console.error('Error updating grading scale:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const deleteGradingScale = async (req, res) => {
    try {
        const scale = await GradingScale.findByIdAndDelete(req.params.id);
        if (!scale) {
            return res.status(404).json({ success: false, message: 'Grading scale not found' });
        }
        res.status(200).json({ success: true, message: 'Grading scale deleted successfully' });
    } catch (error) {
        console.error('Error deleting grading scale:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const setActiveGradingScale = async (req, res) => {
    try {
        // Get the scale being activated
        const scale = await GradingScale.findById(req.params.id);
        if (!scale) {
            return res.status(404).json({ success: false, message: 'Grading scale not found' });
        }

        // Deactivate only scales that have overlapping classes with this scale
        await GradingScale.updateMany(
            { 
                _id: { $ne: req.params.id },
                applicableClasses: { $in: scale.applicableClasses }
            },
            { isActive: false }
        );

        // Activate the selected scale
        const activatedScale = await GradingScale.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true }
        );

        res.status(200).json({ success: true, data: activatedScale });
    } catch (error) {
        console.error('Error setting active grading scale:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getGrade = async (req, res) => {
    try {
        const { score, className } = req.query;
        if (!score) {
            return res.status(400).json({ success: false, message: 'Score is required' });
        }
        const grade = await getGradeFromScore(parseFloat(score), className);
        res.status(200).json({ success: true, grade });
    } catch (error) {
        console.error('Error getting grade:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getAllGradingScales,
    getGradingScaleById,
    createGradingScale,
    updateGradingScale,
    deleteGradingScale,
    setActiveGradingScale,
    getApplicableGradingScale,
    getGradeFromScore,
    getGrade
};
