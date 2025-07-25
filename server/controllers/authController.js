const User = require('../models/User');
const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user (Signup)
// @route   POST /api/auth/register

exports.register = async (req, res) => {
    const { fullName, username, password, role } = req.body;
    
    // Check if we are on the public route
    const isPublicRoute = req.path.includes('/public');
    const userCount = await User.countDocuments({});

    if (isPublicRoute && userCount > 0) {
        return res.status(403).json({ message: 'Public registration is closed.' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
        return res.status(400).json({ message: 'Username already exists.' });
    }
    
    let userRole = (userCount === 0) ? 'admin' : (role || 'teacher');

    try {
        const user = await User.create({ fullName, username, password, role: userRole });
        const responseUser = user.toObject();
        delete responseUser.password;
        res.status(201).json(responseUser);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', details: error.message });
    }
};

// @desc    Authenticate a user (Login)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username }).select('+password');
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
        

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            role: user.role,
            homeroomGrade: user.homeroomGrade,
            token: generateToken(user._id, 'user')
        });

    } catch (error) {
        console.error("Admin/Teacher Login Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};