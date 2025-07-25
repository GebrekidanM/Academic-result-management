// backend/controllers/studentAuthController.js
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

const generateStudentToken = (id) => {
    return jwt.sign({ id, type: 'student' }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// --- DEFINITIVE LOGIN FUNCTION ---
exports.loginStudent = async (req, res) => {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
        return res.status(400).json({ message: 'Student ID and password are required.' });
    }

    try {
        // Find the student and explicitly select the password field
        const student = await Student.findOne({ studentId }).select('+password');

        if (!student) {
            return res.status(401).json({ message: 'Invalid Student ID or password.' });
        }
        
        // Use the instance method from the Student model to compare passwords
        const isMatch = await student.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Student ID or password.' });
        }

        // If login is successful, generate a token with the 'student' type
        res.json({
            _id: student._id,
            studentId: student.studentId,
            fullName: student.fullName,
            isInitialPassword: student.isInitialPassword,
            // The critical change is here:
            token: generateStudentToken(student._id, 'student'),
        });
        
    } catch (error) {
        console.error("Parent/Student Login Error:", error);
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
        // The 'protectStudent' middleware gives us the logged-in student's ID via req.student._id
        // We fetch the full student document from the database using that trusted ID.
        const student = await Student.findById(req.student._id);

        if (student) {
            // By setting the password field directly on the document...
            student.password = newPassword;
            student.isInitialPassword = false;
            
            // ...and then calling .save(), we GUARANTEE that our .pre('save')
            // password hashing middleware will run.
            await student.save();
            
            res.json({ message: 'Password updated successfully.' });
        } else {
            res.status(404).json({ message: 'Student not found.' });
        }
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};