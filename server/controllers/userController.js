const xlsx = require('xlsx');
const fs = require('fs');
const User = require('../models/User');
const capitalizeName = require('../utils/capitalizeName');

// @desc    Get all users (for Admin)
// @route   GET /api/users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .populate('subjectsTaught.subject');
        
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get the current logged-in user's profile
// @route   GET /api/users/profile
exports.getUserProfile = async (req, res) => {
    if (req.user) {
        res.json(req.user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get user by ID (for Admin)
// @route   GET /api/users/:id
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password').populate('subjectsTaught.subject');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user (for Admin to assign subjects)
// @route   PUT /api/users/:id

exports.updateUser = async (req, res) => {
    try {
        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { fullName, role, subjectsTaught, homeroomGrade } = req.body;

        // --- VALIDATION 1: Check for Subject Assignment Conflicts ---
        if (subjectsTaught) {
            const subjectIdsToAssign = subjectsTaught.map(item => item.subject);
            const conflictingTeacher = await User.findOne({
                'subjectsTaught.subject': { $in: subjectIdsToAssign },
                _id: { $ne: userToUpdate._id }
            }).populate('subjectsTaught.subject');

            if (conflictingTeacher) {
                const conflictingSubject = conflictingTeacher.subjectsTaught.find(
                    assignment => subjectIdsToAssign.includes(assignment.subject._id.toString())
                ).subject;
                return res.status(400).json({
                    message: `Assignment failed. The subject "${conflictingSubject.name} (${conflictingSubject.gradeLevel})" is already assigned to another teacher: ${conflictingTeacher.fullName}.`
                });
            }
        }

        // --- VALIDATION 2: Check for Homeroom Teacher Conflicts ---
        // This check only runs if the admin is trying to assign a homeroom grade.
        if (homeroomGrade) {
            const conflictingHomeroomTeacher = await User.findOne({
                homeroomGrade: homeroomGrade,
                _id: { $ne: userToUpdate._id } // Exclude the current user
            });

            if (conflictingHomeroomTeacher) {
                // Send back a clear, specific error message
                return res.status(400).json({
                    message: `Assignment failed. The grade "${homeroomGrade}" already has a homeroom teacher: ${conflictingHomeroomTeacher.fullName}.`
                });
            }
        }
        
        // --- If all validations pass, proceed with the update ---
        userToUpdate.fullName = capitalizeName(fullName || userToUpdate.fullName);
        userToUpdate.role = role || userToUpdate.role;
        
        if (subjectsTaught !== undefined) {
            userToUpdate.subjectsTaught = subjectsTaught;
        }

        // Handle homeroomGrade update (set to null if empty string is passed)
        if (homeroomGrade !== undefined) {
            userToUpdate.homeroomGrade = homeroomGrade || null;
        }
        
        const updatedUser = await userToUpdate.save();
        await updatedUser.populate('subjectsTaught.subject');
        res.json(updatedUser);

    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};

// @desc    Create multiple users from an uploaded Excel file (Admin only)
// @route   POST /api/users/upload
exports.bulkCreateUsers = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    const filePath = req.file.path;

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const usersJson = xlsx.utils.sheet_to_json(worksheet);

        if (usersJson.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'The Excel file is empty.' });
        }

        const usersToProcess = usersJson.map(user => {
            const initialPassword = user['Password'] || user['password'];
            if (!initialPassword) {
                throw new Error(`Password is missing for user: ${user['Full Name'] || user['Username']}`);
            }
            return {
                fullName: user['Full Name'] || user['fullName'],
                username: user['Username'] || user['username'],
                role: (user['Role'] || user['role'] || 'teacher').toLowerCase(),
                password: initialPassword,
                initialPassword: initialPassword
            };
        });
        
        // --- THE CRITICAL SECURITY FIX ---
        // We replace the insecure insertMany with a secure loop.
        const createdUsersForResponse = [];
        for (const userData of usersToProcess) {
            const user = new User({
                fullName: capitalizeName(userData.fullName),
                username: userData.username,
                role: userData.role,
                password: userData.password 
            });
            await user.save();
            
            // Prepare the data for the final response
            createdUsersForResponse.push({
                fullName: user.fullName,
                username: user.username,
                role: user.role,
                initialPassword: userData.initialPassword
            });
        }
        // --- END OF FIX ---

        fs.unlinkSync(filePath);
        res.status(201).json({
            message: `${createdUsersForResponse.length} users imported successfully.`,
            data: createdUsersForResponse
        });

    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (error.code === 11000 || error.name === 'MongoBulkWriteError' || error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Import failed. One or more usernames may already exist or have invalid data.' });
        }
        console.error('Error importing users:', error);
        res.status(500).json({ message: 'An error occurred during the import process.' });
    }
};

// @desc    Get the homeroom teacher for a specific grade level
// @route   GET /api/users/homeroom-teacher?gradeLevel=...
exports.getHomeroomTeacher = async (req, res) => {
    const { gradeLevel } = req.query;
    if (!gradeLevel) {
        return res.status(400).json({ message: 'Grade Level is required.' });
    }

    try {
        const homeroomTeacher = await User.findOne({
            role: 'teacher',
            homeroomGrade: gradeLevel
        }).select('fullName');

        if (homeroomTeacher) {
            res.json(homeroomTeacher);
        } else {
            res.status(404).json({ message: 'No homeroom teacher found for this grade level.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};