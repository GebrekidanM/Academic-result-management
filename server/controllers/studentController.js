const xlsx = require('xlsx');
const fs = require('fs');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const User = require('../models/User');

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

// Helper to get Ethiopian Year (used for Password generation only now)
const getEthiopianYear = () => {
    const today = new Date();
    const gregorianYear = today.getFullYear();
    const gregorianMonth = today.getMonth() + 1;
    return gregorianMonth > 8 ? gregorianYear - 7 : gregorianYear - 8;
};

// @desc Get all students or by grade
// @route GET /api/students

exports.getStudents = async (req, res) => {
    try {
        const { gradeLevel } = req.query;
        
        const constraints = [];

        // 1. Specific Filter (from Frontend)
        if (gradeLevel) {
            constraints.push({ gradeLevel: gradeLevel });
        }

        // 2. Role Based Restrictions

        // A. ADMIN: Access All
        if (req.user.role === 'admin') {
            // No constraints
        }

        // B. STAFF: Filter by School Level (Updated Regex)
        else if (req.user.role === 'staff') {
            const level = req.user.schoolLevel;

            if (level === 'kg') {
                // Matches: "KG 1", "KG 1A", "Nursery", "Nursery A"
                constraints.push({ gradeLevel: { $regex: /^(kg|nursery)/i } });
            } 
            else if (level === 'primary') {
                // Matches: "Grade 1", "Grade 1A", "Grade 8C"
                // Logic: Starts with Grade, then 1-8, then optional letters
                constraints.push({ gradeLevel: { $regex: /^Grade\s*[1-8](\D|$)/i } });
            } 
            else if (level === 'High School') {
                // Matches: "Grade 9", "Grade 9A", "Grade 10B", "Grade 12C"
                // Logic: Starts with Grade, then 9-12, then optional letters
                constraints.push({ gradeLevel: { $regex: /^Grade\s*(9|1[0-2])(\D|$)/i } });
            }
        }

        // C. TEACHER: Filter by Assigned Subjects/Homeroom
        else if (req.user.role === 'teacher') {
            const teacher = await User.findById(req.user._id).populate('subjectsTaught.subject');
            const allowedGrades = new Set();

            if (teacher.homeroomGrade) allowedGrades.add(teacher.homeroomGrade);
            
            if (teacher.subjectsTaught) {
                teacher.subjectsTaught.forEach(assign => {
                    if (assign.subject?.gradeLevel) allowedGrades.add(assign.subject.gradeLevel);
                });
            }

            const allowedArray = Array.from(allowedGrades);
            
            // If no assignments, return empty
            if (allowedArray.length === 0) return res.json({ success: true, count: 0, data: [] });
            
            // Teacher sees "Grade 1A" if they teach "Grade 1A"
            constraints.push({ gradeLevel: { $in: allowedArray } });
        }

        // 3. Execute
        let finalQuery = {};
        if (constraints.length > 0) {
            finalQuery = { $and: constraints };
        }

        const students = await Student.find(finalQuery)
            // Sort by Grade Level (alphabetically) then Name
            .sort({ gradeLevel: 1, fullName: 1 }) 
            .select('studentId fullName gender imageUrl gradeLevel status');
        
        res.json({ success: true, count: students.length, data: students });

    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single student by ID
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


// @desc    Create a single new student
// @route   POST /api/students
exports.createStudent = async (req, res) => {
    const currentUser = req.user; 
    const { fullName, gender, dateOfBirth, gradeLevel, motherName, motherContact, fatherContact, healthStatus } = req.body;

    try {
        // 🔹 Permission check
        if (currentUser.role === 'teacher') {
            if (!currentUser.homeroomGrade || currentUser.homeroomGrade !== gradeLevel) {
                return res.status(403).json({ message: 'You can only create students in your homeroom grade.' });
            }
        } else if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to create students.' });
        }

        // 🔹 Capitalize full name
        const capitalizedFullName = capitalizeName(fullName);

        // 🔹 Calculate Year ONLY for Password (ID is handled by Model now)
        const currentYear = getEthiopianYear();

        // 🔹 Generate initial password
        const middleName = getFirstName(capitalizedFullName);
        const initialPassword = `${middleName}@${currentYear}`;

        // 🔹 Create student (NO studentId passed here)
        const student = new Student({
            // studentId: REMOVED (Handled by Mongoose Pre-Save Hook)
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

        // The save() method triggers the Hook in Student.js which generates the ID
        await student.save(); 

        const responseData = student.toObject();
        responseData.initialPassword = initialPassword;
        delete responseData.password;

        res.status(201).json({ success: true, data: responseData });

    } catch (error) {
        if (error.code === 11000) {
            // Check if error is related to FullName+MotherName index or the StudentId
            if (error.keyPattern && error.keyPattern.studentId) {
                return res.status(500).json({ message: 'Error generating ID. Please try again.' });
            }
            if (error.keyPattern && error.keyPattern.fullName && error.keyPattern.motherName) {
                return res.status(400).json({ message: 'A student with the same name and mother name already exists.' });
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
        const currentUser = req.user;
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found.' });

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

        // We use findByIdAndUpdate, so the 'pre save' hook (ID generator) DOES NOT fire
        // This is good, because we don't want to change the ID on update.
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
exports.deleteStudent = async (req, res) => {
    try {
        const currentUser = req.user;
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

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

// @desc    Upload student profile photo
// @route   POST /api/students/:id/photo
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file was uploaded.' });

        const currentUser = req.user;
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found.' });

        if (currentUser.role === 'teacher') {
            if (!currentUser.homeroomGrade || currentUser.homeroomGrade !== student.gradeLevel) {
                return res.status(403).json({ message: 'You are not authorized to update this student.' });
            }
        } else if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to update students.' });
        }

        student.imageUrl = req.file.path; 
        student.imagePublicId = req.file.filename; 
        await student.save({ validateBeforeSave: false }); // Validations skipped, but pre-save hooks run (checked by isNew)

        res.status(200).json({ message: 'Profile photo updated successfully', imageUrl: student.imageUrl });

    } catch (error) {
        res.status(500).json({ message: 'Error uploading photo', details: error.message });
    }
};

// @desc    Create multiple students from Excel
// @route   POST /api/students/upload
exports.bulkCreateStudents = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const filePath = req.file.path;

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(worksheet);

        if (!rows.length) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'The Excel file is empty.' });
        }

        const requiredColumns = ['Full Name', 'Gender', 'Grade Level'];
        const missing = requiredColumns.filter(c => !Object.keys(rows[0]).includes(c));

        if (missing.length) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: `Missing required columns: ${missing.join(', ')}` });
        }

        // Get Year for PASSWORDS only
        const currentYear = getEthiopianYear();

        // ❌ REMOVED: lastStudent and lastSeq calculation. 
        // We will rely on newStudent.save() inside the loop.

        const createdStudents = [];
        let rowNumber = 2; 

        // Helper: Date parsing (Kept same as your code)
        function convertEthiopianToGregorian(ethYear, ethMonth, ethDay) {
            const jd = Math.floor(1723856 + 365 + 365 * (ethYear - 1) + Math.floor(ethYear / 4) + 30 * ethMonth + ethDay - 31);
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

        function parseExcelDate(value) {
            if (!value) return null;
            if (!isNaN(value)) {
                const excelEpoch = new Date(1899, 11, 30);
                return new Date(excelEpoch.getTime() + value * 86400000);
            }
            const parts = value.toString().split(/[-/]/);
            if (parts.length === 3) {
                let [day, month, year] = parts.map(Number);
                if (year < 1800 && day > 1900) { [year, month, day] = [day, month, year]; }
                if (year < 1800) { return convertEthiopianToGregorian(year, month, day); } 
                else { return new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`); }
            }
            return null;
        }

        // ------------------------
        //   PROCESS EACH STUDENT
        // ------------------------

        for (const row of rows) {
            try {
                // ❌ REMOVED: studentId generation here.

                const fullName = capitalizeName(row['Full Name']);
                const motherName = row['Mother Name'] || '';
                const gradeLevel = row['Grade Level'];

                // Check duplicate
                const exists = await Student.findOne({ fullName, motherName, gradeLevel });
                if (exists) {
                    createdStudents.push({ status: "skipped", row: rowNumber, fullName, reason: "Duplicate student" });
                    rowNumber++;
                    continue;
                }

                const parsedDOB = parseExcelDate(row['Date of Birth']);
                const initialPassword = `${getFirstName(fullName)}@${currentYear}`;

                const newStudent = new Student({
                    // studentId: REMOVED (Handled by Model)
                    fullName,
                    gender: row['Gender'],
                    dateOfBirth: parsedDOB || null,
                    gradeLevel,
                    motherName,
                    motherContact: row['Mother Contact'] || '',
                    fatherContact: row['Father Contact'] || '',
                    password: initialPassword,
                    healthStatus: row['Health Status'] || 'No known conditions'
                });

                // ⚠️ IMPORTANT: Saving inside the loop ensures the Atomic Counter hook
                // runs for each student one by one, preventing duplicates.
                await newStudent.save();

                createdStudents.push({
                    status: "created",
                    row: rowNumber,
                    studentId: newStudent.studentId, // Access the auto-generated ID
                    fullName,
                    initialPassword
                });

            } catch (rowErr) {
                createdStudents.push({ status: "error", row: rowNumber, fullName: row['Full Name'], reason: rowErr.message });
            }
            rowNumber++;
        }

        fs.unlinkSync(filePath);

        return res.status(201).json({
            message: "Import completed.",
            summary: {
                created: createdStudents.filter(s => s.status === "created").length,
                skipped: createdStudents.filter(s => s.status === "skipped").length,
                errors: createdStudents.filter(s => s.status === "error").length
            },
            results: createdStudents
        });

    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(500).json({ message: "Server error processing the file.", details: err.message });
    }
};

exports.resetPassword = async (req,res)=>{
    const _id = req.params.studentId;

    try {
        const student = await Student.findById(_id).select('+password');
        if(!student) return res.status(404).json({message:"No Student found with this ID"});
        
        const currentUser = req.user;
        if (currentUser.role === 'teacher') {
            if (!currentUser.homeroomGrade || currentUser.homeroomGrade !== student.gradeLevel) {
                return res.status(403).json({ message: 'You are not authorized to reset this student\'s password.' });
            }
        } else if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to reset student passwords.' });
        }
        
        const firstName = getFirstName(student.fullName);
        const currentYear = getEthiopianYear();
        const password = `${firstName}@${currentYear}`
        
        student.password = password;
        student.isInitialPassword = true;

        await student.save(); // This is NOT 'new', so ID generator hook will be skipped. Good.

        res.status(200).json({ success: true, message: 'Password reset successfully.' });
        
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}