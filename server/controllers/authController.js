const User = require('../models/User');
const capitalizeName = require('../utils/capitalizeName');
const generateToken = require('../utils/generateToken');

// This is the definitive and simplified register function.
// It is only ever called by a logged-in admin.
exports.register = async (req, res) => {
    // The 'authorize('admin')' middleware has already confirmed the user is an admin.
    const { fullName, username, password, role,schoolLevel} = req.body;
    
    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'A user with this username already exists.' });
        }
        const userRole = role || 'teacher'; // Default to 'teacher' if no role provided

        const user = await User.create({
            fullName:capitalizeName(fullName),
            username,
            schoolLevel,
            password,
            role: userRole
        });

        const responseUser = user.toObject();
        delete responseUser.password;
        res.status(201).json(responseUser);

    } catch (error) {
        res.status(400).json({ message: 'Invalid user data', details: error.message });
    }
};


// @desc    Authenticate a user (Login)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Convert input to lowercase before querying
    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid username or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid username or password' });

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      schoolLevel: user.schoolLevel,
      homeroomGrade: user.homeroomGrade,
      token: generateToken(user._id, 'user')
    });

  } catch (error) {
    console.error("Admin/Teacher Login Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};
