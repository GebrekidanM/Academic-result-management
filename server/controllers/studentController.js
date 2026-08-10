// server/controllers/studentController.js
const xlsx = require('xlsx');
const fs = require('fs');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const User = require('../models/User');
const GradeLevel = require('../models/GradeLevel');
const calculateAge = require('../utils/calculateAge');
const cloudinary = require('cloudinary').v2; 
const { logActivity } = require('../utils/logger'); 
const mongoose = require('mongoose');

// Helper to capitalize full names neatly
const capitalizeName = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

// Helper to pull first name for default password generation
const getFirstName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'User';
    const names = fullName.trim().split(/\s+/);
    const firstName = names[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

// Helper to safely parse dates from Excel rows (including serial numbers)
const parseExcelDate = (excelDate) => {
    if (!excelDate) return null;
    if (excelDate instanceof Date) return excelDate;
    if (typeof excelDate === 'string') {
        const parsed = Date.parse(excelDate);
        return isNaN(parsed) ? null : new Date(parsed);
    }
    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return isNaN(date.getTime()) ? null : date;
    }
    return null;
};

// Dynamically calculate current Ethiopian Calendar (EC) Year
const getEthiopianYear = (gregorianDate = new Date()) => {
    const year = gregorianDate.getFullYear();
    const month = gregorianDate.getMonth();
    const day = gregorianDate.getDate();

    let ethiopianYear = year - 8;
    if (month > 8 || (month === 8 && day >= 11)) {
        ethiopianYear = year - 7;
    }
    return ethiopianYear;
};

// DRY Optimization: Shared authorization logic helper (ObjectID-safe)
const hasAccessToStudent = (user, studentGradeLevelId, allowedRoles = ['admin']) => {
    if (user.role === 'teacher') {
        const homeroomId = user.homeroomGrade?._id || user.homeroomGrade;
        return homeroomId && homeroomId.toString() === studentGradeLevelId.toString();
    }
    return allowedRoles.includes(user.role);
};

// Shared grade level formatting logic (used primarily for Excel cleanup)
function formatGrade(input) {
  if (!input) return input;
  let formatted = input.trim().toLowerCase();
  formatted = formatted.replace(/-/g, ' ');
  formatted = formatted.replace(/\bgtade\b/g, 'grade');
  formatted = formatted.replace(/\b([a-z])/g, (match) => match.toUpperCase());
  formatted = formatted.replace(/(\d)\s*([a-z])/gi, (match, num, letter) => {
    return num + letter.toUpperCase();
  });
  return formatted;
}


// @desc Get all students or by grade
// @route GET /api/students
exports.getStudents = async (req, res) => {
    try {
        const { gradeLevel } = req.query;
        const constraints = [{ status: 'Active' }];

        // 1. Specific Filter (from Frontend)
        if (gradeLevel) {
            constraints.push({ gradeLevel: gradeLevel });
        }

        // 2. Role Based Restrictions
        if (req.user.role === 'admin') {
            // Admin: No added restrictions
        } 
        else if (req.user.role === 'staff') {
            const level = req.user.schoolLevel;
            
            const matchedGrades = await GradeLevel.find({ schoolLevel: level }).select('_id');
            const gradeIds = matchedGrades.map(g => g._id);
            constraints.push({ gradeLevel: { $in: gradeIds } });
        } 
        else if (req.user.role === 'teacher') {
            const teacher = await User.findById(req.user._id).populate('subjectsTaught.subject');
            const allowedGrades = new Set();

            if (teacher.homeroomGrade) {
                allowedGrades.add(teacher.homeroomGrade.toString());
            }
            
            if (teacher.subjectsTaught) {
                teacher.subjectsTaught.forEach(assign => {
                    const assignGradeId = assign.gradeLevel?._id || assign.gradeLevel;
                    if (assignGradeId) allowedGrades.add(assignGradeId.toString());
                });
            }

            const allowedArray = Array.from(allowedGrades);
            if (allowedArray.length === 0) {
                return res.json({ success: true, count: 0, data: [] });
            }
            constraints.push({ gradeLevel: { $in: allowedArray } });
        }

        // 3. Execute Query
        let finalQuery = constraints.length > 0 ? { $and: constraints } : {};

        const students = await Student.find(finalQuery)
            .populate('gradeLevel', 'name') // ALIGNED: Populate class name
            .sort({ fullName: 1 }) 
            .select('studentId fullName gender imageUrl gradeLevel status dateOfBirth fatherContact healthStatus motherName motherContact year');
        
        res.json({ success: true, count: students.length, data: students });

    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @route   GET /api/students/getallstudents
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find({})
            .populate('gradeLevel', 'name')
            .populate('academicHistory.gradeAtThatTime', 'name')
            .select('studentId fullName gender imageUrl gradeLevel nationalIdNumber status dateOfBirth fatherContact healthStatus motherName motherContact year');
        
        if (!students) {
            return res.json({ message: "no student" });
        }
        res.status(200).json({ success: true, count: students.length, data: students });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Student not found (Invalid ID format).' });
        }

        const student = await Student.findById(id).populate('gradeLevel', 'name');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // Scope grade calculations to the student's current active year
        const grades = await Grade.find({ student: student._id, academicYear: student.year });
        let promotionStatus = 'To Be Determined';
        let overallAverage = 0;

        if (grades.length > 0) {
            const totalScore = grades.reduce((sum, grade) => sum + (grade.finalScore || 0), 0);
            overallAverage = totalScore / grades.length;
            promotionStatus = overallAverage >= 50 ? 'Promoted' : 'Not Promoted';
        }
        
        const studentObject = student.toObject();
        studentObject.age = calculateAge(student.dateOfBirth); 
        studentObject.promotionStatus = promotionStatus;
        studentObject.overallAverage = parseFloat(overallAverage.toFixed(1));
        
        res.json({ success: true, data: studentObject });

    } catch (error) {
        console.error("Error in getStudentById:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a single new student
// @route   POST /api/students
exports.createStudent = async (req, res) => {
    const currentUser = req.user;

    const { 
        fullName, gender, dateOfBirth, gradeLevel, year, // gradeLevel is now an ObjectID from frontend
        motherName, motherContact, fatherContact, healthStatus,
        nationalIdNumber
    } = req.body;

    try {
        if (!hasAccessToStudent(currentUser, gradeLevel, ['admin', 'accountant'])) {
            return res.status(403).json({ message: 'You are not authorized to register students for this grade.' });
        }

        // Fetch GradeLevel document name for Audit Logs
        const classDoc = await GradeLevel.findById(gradeLevel);
        const className = classDoc ? classDoc.name : 'Unknown';

        const capitalizedFullName = capitalizeName(fullName);
        const initialPassword = `${getFirstName(capitalizedFullName)}@${year}`;

        const transferLetter = req.files && req.files['transferLetter'] ? req.files['transferLetter'][0] : null;
        const certificate = req.files && req.files['certificate'] ? req.files['certificate'][0] : null;
        const birthCertificate = req.files && req.files['birthCertificate'] ? req.files['birthCertificate'][0] : null;
        const nationalId = req.files && req.files['nationalId'] ? req.files['nationalId'][0] : null;

        const student = new Student({
            fullName: capitalizedFullName,
            gender,
            dateOfBirth,
            gradeLevel, // ALIGNED: Stored directly as ObjectID reference
            year: String(year),
            password: initialPassword,
            motherName,
            motherContact,
            fatherContact,
            healthStatus,
            nationalIdNumber: nationalIdNumber || '', 
            transferLetterUrl: transferLetter ? transferLetter.path : '',
            transferLetterPublicId: transferLetter ? transferLetter.filename : '',
            certificateUrl: certificate ? certificate.path : '',
            certificatePublicId: certificate ? certificate.filename : '',
            birthCertificateUrl: birthCertificate ? birthCertificate.path : '', 
            birthCertificatePublicId: birthCertificate ? birthCertificate.filename : '', 
            nationalIdUrl: nationalId ? nationalId.path : '',
            nationalIdPublicId: nationalId ? nationalId.filename : ''
        });

        await student.save(); 

        await logActivity(
            currentUser._id, 
            "Student Registration", 
            `Registered a new student: ${capitalizedFullName} (${student.studentId}) for ${className}`, 
            req
        );

        const responseData = student.toObject();
        responseData.initialPassword = initialPassword;
        delete responseData.password;

        res.status(201).json({ success: true, data: responseData });

    } catch (error) {
        if (error.code === 11000) {
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

        // 1. Verify access to current grade level [1]
        if (!hasAccessToStudent(currentUser, student.gradeLevel, ['admin', 'accountant'])) {
            return res.status(403).json({ message: 'You are not authorized to update this student.' });
        }

        // 2. Dynamic Update Security: Verify access to the TARGET grade level if moving classes [1]
        if (req.body.gradeLevel && req.body.gradeLevel.toString() !== student.gradeLevel.toString()) {
            if (!hasAccessToStudent(currentUser, req.body.gradeLevel, ['admin', 'accountant'])) {
                return res.status(403).json({ message: 'You are not authorized to transition students to this class.' });
            }
        }

        const { fullName, ...otherData } = req.body;
        const updateData = { ...otherData };

        if (fullName) {
            updateData.fullName = capitalizeName(fullName);
        }

        // Process any newly uploaded documents and delete previous ones from Cloudinary [2]
        const fileFields = ['transferLetter', 'certificate', 'birthCertificate', 'nationalId'];
        
        for (const field of fileFields) {
            if (req.files && req.files[field]) {
                const newFile = req.files[field][0];
                
                // 1. Delete old file from Cloudinary if it exists [2]
                const oldPublicId = student[`${field}PublicId`];
                if (oldPublicId) {
                    try {
                        await cloudinary.uploader.destroy(oldPublicId);
                    } catch (destroyError) {
                        console.error(`Failed to delete old ${field} from Cloudinary:`, destroyError);
                    }
                }

                // 2. Set new file URL and Public ID
                updateData[`${field}Url`] = newFile.path;
                updateData[`${field}PublicId`] = newFile.filename;
            }
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({ success: true, data: updatedStudent });

    } catch (error) {
        console.error("Error in updateStudent:", error);
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

        if (!hasAccessToStudent(currentUser, student.gradeLevel, ['admin'])) {
            return res.status(403).json({ message: 'You are not authorized to delete this student.' });
        }

        await student.deleteOne();
        res.json({ success: true, message: 'Student deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Deactivate a student
// @route   POST /api/students/:id
exports.deactiveStudent = async (req, res) => {
    const { reason } = req.body;

    try {
        const currentUser = req.user;
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        if (!hasAccessToStudent(currentUser, student.gradeLevel, ['admin'])) {
            return res.status(403).json({ message: 'You are not authorized to update this student.' });
        }
        
        student.status = reason; 
        await student.save();

        await logActivity(
            currentUser._id, 
            "Student Deactivation", 
            `Deactivated student: ${student.fullName} (${student.studentId}). Status changed to: ${reason}`, 
            req
        );
        
        res.json({ success: true, message: 'Student status updated successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upload student profile photo
// @route   POST /api/students/photo/:id
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file was uploaded.' });

        const currentUser = req.user;
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found.' });

        if (!hasAccessToStudent(currentUser, student.gradeLevel, ['admin'])) {
            return res.status(403).json({ message: 'You are not authorized to update this student.' });
        }

        // Delete old photo from cloud storage if it exists to prevent space leaks
        if (student.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(student.imagePublicId);
            } catch (destroyError) {
                console.error('Failed to delete old image from cloud:', destroyError);
            }
        }

        student.imageUrl = req.file.path; 
        student.imagePublicId = req.file.filename; 
        
        await student.save({ validateBeforeSave: false });
        
        res.status(200).json({ 
            message: 'Profile photo updated successfully', 
            imageUrl: student.imageUrl 
        });
    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: 'Error uploading photo', details: error.message });
    }
};

// @desc    Create multiple students from Excel
// @route   POST /api/students/upload
exports.bulkCreateStudents = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const currentUser = req.user;
    if (!['admin', 'accountant'].includes(currentUser.role)) {
        return res.status(403).json({ message: 'You are not authorized to execute bulk student imports.' });
    }

    const { year } = req.body; 
    if (!year) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Year is required for bulk import.' });
    }

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

        // --- PERFORMANCE OPTIMIZATION: Fetch all GradeLevels once into memory ---
        const allGradeLevels = await GradeLevel.find({}).select('name _id');
        const gradeLevelMap = new Map();
        allGradeLevels.forEach(gl => {
            gradeLevelMap.set(gl.name.toLowerCase().trim(), gl._id);
        });

        const createdStudents = [];
        let rowNumber = 2; 

        for (const row of rows) {
            try {
                const fullName = capitalizeName(row['Full Name']);
                const motherName = row['Mother Name'] || '';
                const rawGradeString = formatGrade(row['Grade Level']); 
                const normalizedGradeKey = rawGradeString ? rawGradeString.toLowerCase().trim() : '';

                // Instant in-memory Map lookup
                const gradeLevelId = gradeLevelMap.get(normalizedGradeKey);

                if (!gradeLevelId) {
                    createdStudents.push({ 
                        status: "error", 
                        row: rowNumber, 
                        fullName, 
                        reason: `Class level "${rawGradeString}" does not exist in the database. Please create it first.` 
                    });
                    rowNumber++;
                    continue;
                }

                // Check for duplicate student
                const exists = await Student.findOne({ fullName, motherName, gradeLevel: gradeLevelId })
                    .collation({ locale: 'en', strength: 2 });

                if (exists) {
                    createdStudents.push({ status: "skipped", row: rowNumber, fullName, reason: "Duplicate student" });
                    rowNumber++;
                    continue;
                }

                const parsedDOB = parseExcelDate(row['Date of Birth']);
                const initialPassword = `${getFirstName(fullName)}@${year}`;

                const newStudent = new Student({
                    fullName,
                    gender: row['Gender'],
                    dateOfBirth: parsedDOB || null,
                    gradeLevel: gradeLevelId,
                    year: String(year),
                    motherName,
                    motherContact: row['Mother Contact'] || '',
                    fatherContact: row['Father Contact'] || '',
                    password: initialPassword,
                    healthStatus: row['Health Status'] || 'No known conditions',
                    nationalIdNumber: row['National ID Number'] || '' 
                });

                await newStudent.save();

                createdStudents.push({
                    status: "created",
                    row: rowNumber,
                    studentId: newStudent.studentId,
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

// @desc    Reset student password
// @route   POST /api/students/reset/:studentId
exports.resetPassword = async (req, res) => {
    const _id = req.params.studentId;

    try {
        const student = await Student.findById(_id).select('+password');
        if(!student) return res.status(404).json({message:"No Student found with this ID"});
        
        const currentUser = req.user;
        if (!hasAccessToStudent(currentUser, student.gradeLevel, ['admin'])) {
            return res.status(403).json({ message: 'You are not authorized to reset this student\'s password.' });
        }
        
        student.password = `123456`;
        student.isInitialPassword = true;

        await student.save();

        await logActivity(
            currentUser._id, 
            "Password Reset", 
            `Reset password for student: ${student.fullName} (${student.studentId})`, 
            req
        );

        res.status(200).json({ success: true, message: 'Password reset successfully.' });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.message})
    }
}

// @desc    Search for existing student by ID for registration
// @route   GET /api/students/search/:studentId
exports.getStudentForRegistration = async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.studentId }).populate('gradeLevel', 'name');
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json({
            _id: student._id,
            studentId: student.studentId,
            fullName: student.fullName,
            currentGrade: student.gradeLevel ? student.gradeLevel.name : 'Unknown', // Returns readable name
            thatYear: student.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Process the "New" Registration
// @route   POST /api/students/re-register
exports.reRegisterStudent = async (req, res) => {
    const currentUser = req.user;
    const { studentId, newGradeLevel, newYear } = req.body; // newGradeLevel is the GradeLevel ObjectID

    try {
        // 2. Promotion Security: Ensure only authorized admins/accountants can execute promotions [1]
        if (!hasAccessToStudent(currentUser, newGradeLevel, ['admin', 'accountant'])) {
            return res.status(403).json({ message: 'You are not authorized to promote students to this grade.' });
        }

        const student = await Student.findOne({ studentId });
        if (!student) return res.status(404).json({ message: "Student not found" });
        
        const historyEntry = {
            year: student.year,
            gradeAtThatTime: student.gradeLevel,
            statusAtEnd: student.status 
        };

        student.academicHistory.push(historyEntry);
        student.gradeLevel = newGradeLevel; // Stored as ObjectID reference [1]
        student.status = 'Active'; 
        student.year = newYear;

        await student.save();
        
        // Fetch class name for response payload
        const classDoc = await GradeLevel.findById(newGradeLevel);
        const className = classDoc ? classDoc.name : 'Class';

        res.json({ message: `${student.fullName} successfully registered for ${className}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get count of students matching current EC year
// @route   GET /api/students/bulk-end-of-year/count
exports.getBulkEndOfYearCount = async (req, res) => {
    try {
        // 3. Year-End Audit Security: Restrict year-end actions to Admin only [1]
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only administrators can perform year-end audits.' });
        }

        const currentECYear = getEthiopianYear().toString();

        const count = await Student.countDocuments({
            year: currentECYear,
            status: { $ne: 'End of Year' }
        });

        return res.status(200).json({
            success: true,
            ethiopianYear: currentECYear,
            eligibleCount: count
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// @desc    Bulk process End of Year for all eligible students
// @route   PUT /api/students/bulk-end-of-year
exports.bulkSetEndOfYearByEC = async (req, res) => {
    try {
        // 4. Year-End Action Security: Restrict bulk updates strictly to Admin [1]
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only administrators can process bulk year-end transitions.' });
        }

        const currentECYear = getEthiopianYear().toString();

        const result = await Student.updateMany(
            { 
                year: currentECYear, 
                status: { $ne: 'End of Year' } 
            },
            [
                {
                    $set: {
                        academicHistory: {
                            $concatArrays: [
                                { $ifNull: ["$academicHistory", []] },
                                [{ year: "$year", gradeAtThatTime: "$gradeLevel", statusAtEnd: "Passed" }]
                            ]
                        },
                        status: "End of Year"
                    }
                }
            ]
        );

        return res.status(200).json({
            success: true,
            message: `Successfully processed ${result.modifiedCount} students for the end of EC Year ${currentECYear}.`,
            count: result.modifiedCount,
            ethiopianYear: currentECYear
        });
    } catch (error) {
        console.error("Bulk End of Year Error:", error);
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
};