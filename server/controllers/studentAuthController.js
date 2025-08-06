const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

const generateStudentToken = (id) => {
    return jwt.sign({ id, type: 'student' }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.loginStudent = async (req, res) => {
    const { studentId, password } = req.body;


    if (!studentId || !password) {
        return res.status(400).json({ message: 'Student ID and password are required.' });
    }

    try {
        const student = await Student.findOne({ studentId }).select('+password');

        if (!student) {
            return res.status(401).json({ message: 'Invalid Student ID or password.' });
        }
        
        const isMatch = await student.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Student ID or password.' });
        }

        res.json({
            _id: student._id,
            studentId: student.studentId,
            fullName: student.fullName,
            isInitialPassword: student.isInitialPassword,
            token: generateStudentToken(student._id, 'student'),
        });
        
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- DEFINITIVE CHANGE PASSWORD FUNCTION ---
exports.changePassword = async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        const student = await Student.findById(req.student._id);

        if (student) {
            student.password = newPassword;
            student.isInitialPassword = false;
            
            await student.save();
            
            res.json({ message: 'Password updated successfully.' });
        } else {
            res.status(404).json({ message: 'Student not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};