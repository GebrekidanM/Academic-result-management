const Student = require('../models/Student');
const User = require('../models/User');
const Subject = require('../models/Subject');

// @desc    Get dashboard statistics for an admin
// @route   GET /api/dashboard/stats
exports.getStats = async (req, res) => {
    try {
        const [studentCount, teacherCount, subjectCount] = await Promise.all([
            Student.countDocuments({ status: 'Active' }),
            User.countDocuments({ role: { $ne: 'admin' } }),
            Subject.distinct('name').then(names => names.length)
        ]);

        res.json({
            students: studentCount,
            teachers: teacherCount,
            subjects: subjectCount
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};