// backend/controllers/studentController.js
const xlsx = require('xlsx');
const fs = require('fs');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const { parseExcelDate } = require('../utils/parseExcelDate');
// --- HELPER FUNCTIONS ---
const capitalizeName = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const getMiddleName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'User';
    const names = fullName.trim().split(/\s+/);
    if (names.length > 2) return names[1].charAt(0).toUpperCase() + names[1].slice(1).toLowerCase();
    if (names.length === 2) return names[0].charAt(0).toUpperCase() + names[0].slice(1).toLowerCase();
    return names[0] || 'User';
};

// --- CONTROLLER FUNCTIONS ---

// @desc    Get all students, sorted
// @route   GET /api/students
exports.getStudents = async (req, res) => {
    try {
        const students = await Student.find({}).sort({ gradeLevel: 1, fullName: 1 });
        res.json({ success: true, count: students.length, data: students });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single student by ID with calculated data
// @route   GET /api/students/:id
exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        
        const grades = await Grade.find({ student: student._id });
        let promotionStatus = 'To Be Determined';
        let overallAverage = 0;

        if (grades.length > 0) {
            const totalScore = grades.reduce((sum, grade) => sum + grade.finalScore, 0);
            overallAverage = totalScore / grades.length;
            if (overallAverage >= 50) promotionStatus = 'Promoted'; else promotionStatus = 'Not Promoted';
        }
        
        const studentObject = student.toObject();
        studentObject.promotionStatus = promotionStatus;
        studentObject.overallAverage = overallAverage;
        
        res.json({ success: true, data: studentObject });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Create a single new student with auto-generated ID and password
// @route   POST /api/students
exports.createStudent = async (req, res) => {
  const { fullName, gender, dateOfBirth, gradeLevel, motherName, motherContact, fatherContact, healthStatus } = req.body;

  try {
    const capitalizedFullName = capitalizeName(fullName);

    // ✅ Ethiopian year calculation
    const today = new Date();
    const gregorianYear = today.getFullYear();
    const gregorianMonth = today.getMonth() + 1;
    const currentYear = gregorianMonth > 8 ? gregorianYear - 7 : gregorianYear - 8;

    const lastStudent = await Student.findOne({ studentId: new RegExp(`^FKS-${currentYear}`) }).sort({ studentId: -1 });
    let lastSequence = lastStudent ? parseInt(lastStudent.studentId.split('-')[2], 10) : 0;
    const newStudentId = `FKS-${currentYear}-${String(lastSequence + 1).padStart(3, '0')}`;

    const middleName = getMiddleName(capitalizedFullName);
    const initialPassword = `${middleName}@${currentYear}`;

    const student = new Student({
      studentId: newStudentId,
      fullName: capitalizedFullName,
      gender,
      dateOfBirth,
      gradeLevel,
      password: initialPassword,
      motherName,
      motherContact,
      fatherContact,
      healthStatus
    });

    await student.save();

    const responseData = student.toObject();
    responseData.initialPassword = initialPassword;
    delete responseData.password;

    res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.fullName && error.keyPattern.motherName) {
        return res.status(400).json({
          message: 'A student with the same name and mother name already exists.'
        });
      }
      return res.status(400).json({ message: 'Duplicate entry detected.' });
    }

    res.status(500).json({ message: 'Server Error', details: error.message });
  }
};


// @desc    Update a student's profile
// @route   PUT /api/students/:id
exports.updateStudent = async (req, res) => {
    try {
        const { fullName, ...otherData } = req.body;
        const updateData = { ...otherData };
        if (fullName) {
            updateData.fullName = capitalizeName(fullName);
        }

        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!updatedStudent) return res.status(404).json({ message: 'Student not found.' });

        res.json({ success: true, data: updatedStudent });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        await student.deleteOne();
        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upload student profile photo to Cloudinary
// @route   POST /api/students/:id/photo
exports.uploadProfilePhoto = async (req, res) => {

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file was uploaded.' });
        }

        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Optional: Remove old image from Cloudinary if you track public_id
        // if (student.imagePublicId) {
        //     await cloudinary.uploader.destroy(student.imagePublicId);
        // }

        student.imageUrl = req.file.path; // Cloudinary URL
        student.imagePublicId = req.file.filename; // optional for future deletions
        await student.save({ validateBeforeSave: false });

        res.status(200).json({
            message: 'Profile photo updated successfully',
            imageUrl: student.imageUrl
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error uploading photo',
            details: error.message
        });
    }
};


// @desc    Create multiple students from an uploaded Excel file
// @route   POST /api/students/upload
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

        // ✅ Validate required columns
        const requiredColumns = ['Full Name', 'Gender', 'Date of Birth', 'Grade Level'];
        const missingColumns = requiredColumns.filter(c => !Object.keys(studentsJson[0]).includes(c));
        if (missingColumns.length) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: `Missing required columns: ${missingColumns.join(', ')}` });
        }

        // ✅ Accurate Ethiopian year calculation
        const today = new Date();
        const gregorianYear = today.getFullYear();
        const gregorianMonth = today.getMonth() + 1;
        const currentYear = gregorianMonth > 8 ? gregorianYear - 7 : gregorianYear - 8;

        // ✅ Generate base student ID
        const lastStudent = await Student.findOne({ studentId: new RegExp(`^FKS-${currentYear}`) }).sort({ studentId: -1 });
        let lastSequence = lastStudent ? parseInt(lastStudent.studentId.split('-')[2], 10) : 0;

        const createdStudentsForResponse = [];

        // ✅ Process each student in Excel file
        for (const [index, student] of studentsJson.entries()) {
            const newSequence = lastSequence + 1 + index;
            const newStudentId = `FKS-${currentYear}-${String(newSequence).padStart(3, '0')}`;

            const fullName = student['Full Name'] || student['fullName'];
            const motherName = student['Mother Name'] || student['motherName'];
            const middleName = getMiddleName(fullName);
            const initialPassword = `${middleName}@${currentYear}`;

            // ✅ Check for duplicates (fullName + motherName)
            const existing = await Student.findOne({ fullName: capitalizeName(fullName), motherName });
            if (existing) {
                console.log(`⚠️ Skipped duplicate: ${fullName} (mother: ${motherName})`);
                continue; // skip this student
            }

            const studentData = {
                studentId: newStudentId,
                fullName: capitalizeName(fullName),
                gender: student['Gender'] || student['gender'],
                dateOfBirth: parseExcelDate(student['Date of Birth'] || student['dateOfBirth']),
                gradeLevel: student['Grade Level'] || student['gradeLevel'],
                motherName: motherName || '',
                motherContact: student['Mother Contact'] || '',
                fatherContact: student['Father Contact'] || '',
                password: initialPassword, // will be hashed by pre-save middleware
                healthStatus: student['Health Status'] || 'No known conditions'
            };

            // ✅ Save new student
            const newStudent = new Student(studentData);
            await newStudent.save();

            const responseData = newStudent.toObject();
            responseData.initialPassword = initialPassword;
            delete responseData.password;
            createdStudentsForResponse.push(responseData);
        }

        fs.unlinkSync(filePath);

        if (createdStudentsForResponse.length === 0) {
            return res.status(200).json({ 
                message: 'No new students added (all were duplicates).'
            });
        }

        res.status(201).json({
            message: `${createdStudentsForResponse.length} students imported successfully.`,
            data: createdStudentsForResponse
        });

    } catch (error) {
        console.error('Bulk Create Error:', error);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (error.code === 11000 || error.name === 'MongoBulkWriteError' || error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Import failed. Students may already exist or have invalid data.' });
        }
        res.status(500).json({ message: 'An error occurred during the import process.', details: error.message });
    }
};
