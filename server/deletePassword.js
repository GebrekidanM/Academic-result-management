const router = require('express').Router();
const Student = require('./models/Student');

router.put('/reset-all-passwords', async (req, res) => {
    try {
        const students = await Student.find();

        for (const student of students) {
            const rawPassword = student.fullName.split(' ')[0] + "@2018";
            student.password = rawPassword;  // pre-save hook will hash this
            student.isInitialPassword = true;
            await student.save();           // bcrypt runs automatically
        }

        return res.status(200).json({
            message: 'Passwords reset successfully for all students.',
            totalUpdated: students.length
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error deleting passwords.' });
    }
});

module.exports = router;
