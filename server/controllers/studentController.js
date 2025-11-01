// backend/controllers/studentController.js
const xlsx = require('xlsx');
const fs = require('fs');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const { parseExcelDate } = require('../utils/parseExcelDate');
const { toGregorian } = require('ethiopian-date');

// --- HELPER FUNCTIONS ---
const capitalizeName = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const getFirstName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'User';
    const names = fullName.trim().split(/\s+/);
    const firstName = names[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

// @desc Get all students or by grade
// @route GET /api/students
exports.getStudents = async (req, res) => {
    try {
        const { gradeLevel } = req.query;
        const query = gradeLevel ? { gradeLevel } : {};
        const students = await Student.find(query)
            .sort({ fullName: 1 })
            .select('studentId fullName gender gradeLevel');
        
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
// controllers/studentController.js
// @access  Admin or Homeroom Teacher
exports.createStudent = async (req, res) => {
    const currentUser = req.user; // from protect middleware
    const { fullName, gender, dateOfBirth, gradeLevel, motherName, motherContact, fatherContact, healthStatus } = req.body;

    try {
        // 🔹 Permission check
        if (currentUser.role === 'teacher') {
            if (!currentUser.homeroomGrade || currentUser.homeroomGrade !== gradeLevel) {
                return res.status(403).json({ 
                    message: 'You can only create students in your homeroom grade.' 
                });
            }
        } else if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to create students.' });
        }

        // 🔹 Capitalize full name
        const capitalizedFullName = capitalizeName(fullName);

        // 🔹 Ethiopian year calculation
        const today = new Date();
        const gregorianYear = today.getFullYear();
        const gregorianMonth = today.getMonth() + 1;
        const currentYear = gregorianMonth > 8 ? gregorianYear - 7 : gregorianYear - 8;

        // 🔹 Generate unique student ID
        const lastStudent = await Student.findOne({ studentId: new RegExp(`^FKS-${currentYear}`) })
                                         .sort({ studentId: -1 });
        let lastSequence = lastStudent ? parseInt(lastStudent.studentId.split('-')[2], 10) : 0;
        const newStudentId = `FKS-${currentYear}-${String(lastSequence + 1).padStart(3, '0')}`;

        // 🔹 Generate initial password
        const middleName = getFirstName(capitalizedFullName);
        const initialPassword = `${middleName}@${currentYear}`;

        // 🔹 Create student
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
        // 🔹 Handle duplicates
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
// controllers/studentController.js

// @access  Admin or Homeroom Teacher (only for their grade)
exports.updateStudent = async (req, res) => {
    try {
        const currentUser = req.user;
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found.' });

        // 🔹 Permission check
        if (currentUser.role === 'teacher') {
            if (!currentUser.homeroomGrade || currentUser.homeroomGrade !== student.gradeLevel) {
                return res.status(403).json({ message: 'You are not authorized to update this student.' });
            }
        } else if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to update students.' });
        }

        const { fullName, ...otherData } = req.body;
        const updateData = { ...otherData };
        if (fullName) {
            updateData.fullName = capitalizeName(fullName);
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({ success: true, data: updatedStudent });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Admin or Homeroom Teacher (only for their grade)
exports.deleteStudent = async (req, res) => {
    try {
        const currentUser = req.user;
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // 🔹 Permission check
        if (currentUser.role === 'teacher') {
            if (!currentUser.homeroomGrade || currentUser.homeroomGrade !== student.gradeLevel) {
                return res.status(403).json({ message: 'You are not authorized to delete this student.' });
            }
        } else if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to delete students.' });
        }

        await student.deleteOne();
        res.json({ success: true, message: 'Student deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upload student profile photo to Cloudinary
// @route   POST /api/students/:id/photo
// @access  Admin or Homeroom Teacher (only for their grade)
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file was uploaded.' });
        }

        const currentUser = req.user;
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found.' });

        // 🔹 Permission check
        if (currentUser.role === 'teacher') {
            if (!currentUser.homeroomGrade || currentUser.homeroomGrade !== student.gradeLevel) {
                return res.status(403).json({ message: 'You are not authorized to update this student.' });
            }
        } else if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to update students.' });
        }

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

// @desc    Create multiple students from an uploaded Excel file (supports Ethiopian DD-MM-YYYY dates)
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
        const requiredColumns = ['Full Name', 'Gender', 'Grade Level'];
        const missingColumns = requiredColumns.filter(c => !Object.keys(studentsJson[0]).includes(c));
        if (missingColumns.length) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: `Missing required columns: ${missingColumns.join(', ')}` });
        }

        // ✅ Accurate Ethiopian academic year calculation
        const today = new Date();
        const gregorianYear = today.getFullYear();
        const gregorianMonth = today.getMonth() + 1;
        const currentYear = gregorianMonth > 8 ? gregorianYear - 7 : gregorianYear - 8;

        // ✅ Generate base student ID
        const lastStudent = await Student.findOne({ studentId: new RegExp(`^FKS-${currentYear}`) }).sort({ studentId: -1 });
        let lastSequence = lastStudent ? parseInt(lastStudent.studentId.split('-')[2], 10) : 0;

        const createdStudentsForResponse = [];

        // --- Helpers ---

        function getFirstName(fullName) {
            return fullName?.split(' ')[0] || '';
        }

        function capitalizeName(name) {
            if (!name) return '';
            return name
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');
        }

        // 📅 Convert Ethiopian date (YYYY, MM, DD) → Gregorian Date object
        function convertEthiopianToGregorian(ethYear, ethMonth, ethDay) {
            const jd = Math.floor(1723856 + 365 + 365 * (ethYear - 1) + Math.floor(ethYear / 4)
                + 30 * ethMonth + ethDay - 31);
            const r = (jd - 1721426) % 1461;
            const n = Math.floor(r / 365) - Math.floor(r / 1460);
            const gYear = Math.floor((jd - 1721426 - r) / 365.25) + n + 1;
            const s = jd - Math.floor((gYear - 1) * 365.25) - 1721426;
            let gMonth, gDay;

            if (s <= 31) { gMonth = 1; gDay = s; }
            else if (s <= 59) { gMonth = 2; gDay = s - 31; }
            else if (s <= 90) { gMonth = 3; gDay = s - 59; }
            else if (s <= 120) { gMonth = 4; gDay = s - 90; }
            else if (s <= 151) { gMonth = 5; gDay = s - 120; }
            else if (s <= 181) { gMonth = 6; gDay = s - 151; }
            else if (s <= 212) { gMonth = 7; gDay = s - 181; }
            else if (s <= 243) { gMonth = 8; gDay = s - 212; }
            else if (s <= 273) { gMonth = 9; gDay = s - 243; }
            else if (s <= 304) { gMonth = 10; gDay = s - 273; }
            else if (s <= 334) { gMonth = 11; gDay = s - 304; }
            else { gMonth = 12; gDay = s - 334; }

            return new Date(`${gYear}-${String(gMonth).padStart(2, '0')}-${String(gDay).padStart(2, '0')}`);
        }

        // 🧩 Parse Excel date (supports DD-MM-YYYY Ethiopian format)
        function parseExcelDate(value) {
            if (!value) return null;

            // Excel serial number
            if (!isNaN(value)) {
                const excelEpoch = new Date(1899, 11, 30);
                return new Date(excelEpoch.getTime() + value * 86400000);
            }

            // Ethiopian calendar in DD-MM-YYYY or DD/MM/YYYY format
            const parts = value.toString().split(/[-/]/);
            if (parts.length === 3) {
                let [day, month, year] = parts.map(Number);

                // Fix if year appears first
                if (year < 1800 && day > 1900) {
                    [year, month, day] = [day, month, year];
                }

                // Ethiopian years are typically < 1800
                if (year < 1800) {
                    return convertEthiopianToGregorian(year, month, day);
                } else {
                    // Gregorian fallback
                    return new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
                }
            }

            return null;
        }

        // --- Process each student ---
        for (const [index, student] of studentsJson.entries()) {
            const newSequence = lastSequence + 1 + index;
            const newStudentId = `FKS-${currentYear}-${String(newSequence).padStart(3, '0')}`;

            const fullName = student['Full Name'] || student['fullName'];
            const motherName = student['Mother Name'] || student['motherName'];
            const middleName = getFirstName(fullName);
            const initialPassword = `${middleName}@${currentYear}`;

            // Check duplicate
            const existing = await Student.findOne({ fullName: capitalizeName(fullName), motherName });
            if (existing) {
                console.log(`⚠️ Skipped duplicate: ${fullName} (mother: ${motherName})`);
                continue;
            }

            const parsedDate = parseExcelDate(student['Date of Birth'] || student['dateOfBirth']);
            
            const studentData = {
                studentId: newStudentId,
                fullName: capitalizeName(fullName),
                gender: student['Gender'] || student['gender'],
                dateOfBirth: parsedDate || '',
                gradeLevel: student['Grade Level'] || student['gradeLevel'],
                motherName: motherName || '',
                motherContact: student['Mother Contact'] || '',
                fatherContact: student['Father Contact'] || '',
                password: initialPassword,
                healthStatus: student['Health Status'] || 'No known conditions'
            };

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
                message: 'No new students added (duplicates or invalid dates).'
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
            return res.status(400).json({ message: 'Import failed. Some students may already exist or have invalid data.' });
        }
        res.status(500).json({ message: 'An error occurred during the import process.', details: error.message });
    }
};

