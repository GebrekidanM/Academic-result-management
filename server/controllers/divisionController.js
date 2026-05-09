const Division = require('../models/Division');

const getApplicableDivision = async (className) => {
    const division = await Division.findOne({
        isActive: true,
        applicableClasses: className
    });
    return division;
};

const getDivisionFromScore = async (score, className) => {
    const division = await getApplicableDivision(className);
    if (!division) return '-';
    
    for (const range of division.ranges) {
        if (score >= range.minScore && score <= range.maxScore) {
            return range.division;
        }
    }
    return '-';
};

const getAllDivisions = async (req, res) => {
    try {
        const divisions = await Division.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: divisions });
    } catch (error) {
        console.error('Error fetching divisions:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getDivisionById = async (req, res) => {
    try {
        const division = await Division.findById(req.params.id);
        if (!division) {
            return res.status(404).json({ success: false, message: 'Division not found' });
        }
        res.status(200).json({ success: true, data: division });
    } catch (error) {
        console.error('Error fetching division:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const createDivision = async (req, res) => {
    try {
        const division = new Division(req.body);
        await division.save();
        res.status(201).json({ success: true, data: division });
    } catch (error) {
        console.error('Error creating division:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

const updateDivision = async (req, res) => {
    try {
        const division = await Division.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!division) {
            return res.status(404).json({ success: false, message: 'Division not found' });
        }
        res.status(200).json({ success: true, data: division });
    } catch (error) {
        console.error('Error updating division:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteDivision = async (req, res) => {
    try {
        const division = await Division.findByIdAndDelete(req.params.id);
        if (!division) {
            return res.status(404).json({ success: false, message: 'Division not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.error('Error deleting division:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const setActiveDivision = async (req, res) => {
    try {
        // Get the division being activated
        const division = await Division.findById(req.params.id);
        if (!division) {
            return res.status(404).json({ success: false, message: 'Division not found' });
        }

        // Deactivate only divisions that have overlapping classes with this division
        await Division.updateMany(
            {
                _id: { $ne: req.params.id },
                applicableClasses: { $in: division.applicableClasses }
            },
            { isActive: false }
        );

        // Activate the selected division
        const activatedDivision = await Division.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true }
        );

        res.status(200).json({ success: true, data: activatedDivision });
    } catch (error) {
        console.error('Error setting active division:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getAllDivisions,
    getDivisionById,
    createDivision,
    updateDivision,
    deleteDivision,
    setActiveDivision,
    getApplicableDivision,
    getDivisionFromScore
};
