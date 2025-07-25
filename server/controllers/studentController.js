const xlsx = require('xlsx');
const fs = require('fs');
const Student = require('../models/Student');
const Grade = require('../models/Grade');

// --- HELPER FUNCTION: Extracts the middle name from a full name string ---
const getMiddleName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'User'; // Fallback
    const names = fullName.trim().split(/\s+/); // Split by spaces
    
    if (names.length > 2) {
        // For names like "Marta Haylu Belay", return "Haylu"
        const middle = names[1];
        return middle.charAt(0).toUpperCase() + middle.slice(1).toLowerCase();
    } else if (names.length === 2) {
        // For names like "Marta Haylu", use the first name as a fallback
        const first = names[0];
        return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
    }
    // For a single name like "Marta", use that name
    return names[0] || 'User';
};

// @desc    Create a single new student with an auto-generated password
// @route   POST /api/students
exports.createStudent = async (req, res) => {
    const { fullName, gender, dateOfBirth, gradeLevel } = req.body;
    
    try {
        const currentYear = new Date().getFullYear() - 8;
        // ... your existing ID generation logic ...
        const newStudentId = `FKS-${currentYear}-${String(newSequence).padStart(3, '0')}`;
        
        // --- NEW: Personalized Password Generation ---
        const middleName = getMiddleName(fullName);
        const initialPassword = `${middleName}@${currentYear}`;

        const student = await Student.create({
            studentId: newStudentId, fullName, gender,
            dateOfBirth, gradeLevel,
            password: initialPassword
        });

        res.status(201).json({ success: true, data: student });

    } catch (error) {
        if (error.code === 11000) {
             return res.status(400).json({ message: 'A student with this ID already exists. Please try again.' });
        }
        console.error("Error creating student:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- The Definitive and Secure bulkCreateStudents function ---
exports.bulkCreateStudents = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const filePath = req.file.path;

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const studentsJson = xlsx.utils.sheet_to_json(worksheet);

        if (studentsJson.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'The Excel file is empty.' });
        }

        const currentYear = new Date().getFullYear() - 8;
        const lastStudent = await Student.findOne({ studentId: new RegExp(`^FKS-${currentYear}`) }).sort({ studentId: -1 });
        let lastSequence = 0;
        if (lastStudent && lastStudent.studentId) {
            lastSequence = parseInt(lastStudent.studentId.split('-')[2], 10);
        }
        
        const studentsToCreateWithPasswords = studentsJson.map((student, index) => {
            const newSequence = lastSequence + 1 + index;
            const newStudentId = `FKS-${currentYear}-${String(newSequence).padStart(3, '0')}`;
            const fullName = student['Full Name'] || student['fullName'];
            const middleName = getMiddleName(fullName); // Use the helper function
            const initialPassword = `${middleName}@${currentYear}`;
            return {
                studentId: newStudentId,
                fullName: fullName,
                gender: student['Gender'] || student['gender'],
                dateOfBirth: new Date(student['Date of Birth'] || student['dateOfBirth']),
                gradeLevel: student['Grade Level'] || student['gradeLevel'],
                password: initialPassword,
                initialPassword: initialPassword
            };
        });
        
        const createdStudentsForResponse = [];
        for (const studentData of studentsToCreateWithPasswords) {
            const student = new Student(studentData);
            await student.save(); // This ensures hashing middleware runs
            
            const responseData = student.toObject();
            responseData.initialPassword = studentData.initialPassword;
            delete responseData.password;
            createdStudentsForResponse.push(responseData);
        }

        fs.unlinkSync(filePath);

        res.status(201).json({ 
            message: `${createdStudentsForResponse.length} students imported successfully.`,
            data: createdStudentsForResponse
        });

    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (error.code === 11000 || error.name === 'MongoBulkWriteError' || error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Import failed. One or more students may already exist or have invalid data.' });
        }
        console.error('Error importing students:', error);
        res.status(500).json({ message: 'An error occurred during the import process.' });
    }
};
// @desc    Get all students
// @route   GET /api/students
// @access  Public
exports.getStudents = async (req, res) => {
    try {
        const students = await Student.find({});
        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Public
exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // --- NEW: Calculate Promotion Status here ---
        const grades = await Grade.find({ student: student._id });
        let promotionStatus = 'To Be Determined';
        let overallAverage = 0;

        if (grades.length > 0) {
            const totalScore = grades.reduce((sum, grade) => sum + grade.finalScore, 0);
            overallAverage = totalScore / grades.length;

            // --- THE PROMOTION RULE ---
            if (overallAverage >= 50) {
                promotionStatus = 'Promoted';
            } else {
                promotionStatus = 'Not Promoted';
            }
        }
        
        // Convert the Mongoose document to a plain JavaScript object
        const studentObject = student.toObject();
        // Attach our calculated virtual properties to the object
        studentObject.promotionStatus = promotionStatus;
        studentObject.overallAverage = overallAverage;
        
        res.json({ success: true, data: studentObject });

    } catch (error) {
        console.error("Error fetching student by ID:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Private (For now, public)
exports.updateStudent = async (req, res) => {
    try {
        let student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        student = await Student.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the modified document
            runValidators: true // Run schema validators
        });

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private (For now, public)
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        await student.deleteOne(); // or await Student.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};