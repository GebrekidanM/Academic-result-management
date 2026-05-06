const xlsx = require('xlsx');
const fs = require('fs');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const User = require('../models/User');
const Class = require('../models/Class');
const Stream = require('../models/Stream');
const calculateAge = require('../utils/calculateAge');
const getCurrentEthDate = require('../utils/thatYear') 
// --- HELPER FUNCTIONS ---
const capitalizeName = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const parseExcelDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    // Excel serial number
    if (!isNaN(value)) return new Date((Number(value) - 25569) * 86400 * 1000);
    // String date
    return new Date(value);
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
        const { classId, streamId } = req.query;
        
        const constraints = [];

        // 1. Specific Filter (from Frontend)
        if (classId) {
            constraints.push({ class: classId });
        }
        if (streamId) {
            constraints.push({ stream: streamId });
        }

        // 2. Role Based Restrictions

        // A. ADMIN: Access All
        if (req.user.role === 'admin') {
            // No constraints
        }

        // B. STAFF: Filter by School Level (Updated Regex)
        else if (req.user.role === 'staff') {
            const level = req.user.schoolLevel;
            const allowedClasses = await Class.find({ schoolLevel: level });
            const classIds = allowedClasses.map(c => c._id);
            constraints.push({ class: { $in: classIds } });
        }

        // C. TEACHER: Filter by Assigned Subjects/Homeroom
        else if (req.user.role === 'teacher') {
            const teacher = await User.findById(req.user._id).populate('subjectsTaught.subject');
            const allowedClasses = new Set();
            const allowedStreams = new Set();

            if (teacher.homeroomClass) allowedClasses.add(teacher.homeroomClass.toString());
            if (teacher.homeroomStream) allowedStreams.add(teacher.homeroomStream.toString());
            
            if (teacher.subjectsTaught) {
                teacher.subjectsTaught.forEach(assign => {
                    if (assign.subject?.class) allowedClasses.add(assign.subject.class.toString());
                });
            }

            if (allowedClasses.size === 0) return res.json({ success: true, count: 0, data: [] });
            
            const classConstraint = { class: { $in: Array.from(allowedClasses) } };
            
            // If teacher has a homeroom stream, they might be restricted to that stream for general view, 
            // but usually teachers see all students in the classes they teach.
            // For now, let's just filter by class.
            constraints.push(classConstraint);
        }

        // 3. Execute
        let finalQuery = {};
        if (constraints.length > 0) {
            finalQuery = { $and: constraints };
        }

        const students = await Student.find(finalQuery)
            .sort({ fullName: 1 }) 
            .populate('class stream', 'className streamName')
            .select('studentId fullName gender imageUrl class stream status');
        
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
        const student = await Student.findById(req.params.id).populate('class stream');
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // Fetch grades for average calculation
        const grades = await Grade.find({ student: student._id });
        let promotionStatus = 'To Be Determined';
        let overallAverage = 0;

        if (grades.length > 0) {
            const totalScore = grades.reduce((sum, grade) => sum + grade.finalScore, 0);
            overallAverage = totalScore / grades.length;
            
            // Simple promotion logic
            if (overallAverage >= 50) {
                promotionStatus = 'Promoted'; 
            } else {
                promotionStatus = 'Not Promoted';
            }
        }
        
        const studentObject = student.toObject();

        // --- INTEGRATION HERE ---
        studentObject.age = calculateAge(student.dateOfBirth); 

        studentObject.promotionStatus = promotionStatus;
        studentObject.overallAverage = parseFloat(overallAverage.toFixed(1));
        
        res.json({ success: true, data: studentObject });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Create a single new student
// @route   POST /api/students
exports.createStudent = async (req, res) => {
    const currentUser = req.user; 
    const { fullName, gender, dateOfBirth, class: classId, stream: streamId, motherName, motherContact, fatherContact, healthStatus } = req.body;

    try {
        // 🔹 Permission check
        if (currentUser.role === 'teacher') {
            if (!currentUser.homeroomClass || currentUser.homeroomClass.toString() !== classId) {
                return res.status(403).json({ message: 'You can only create students in your homeroom class.' });
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
            class: classId,
            stream: streamId,
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
            if (error.keyPattern && error.keyPattern.fullName && error.keyPattern.motherName && error.keyPattern.class) {
                return res.status(400).json({ message: 'A student with the same name, mother name, and class already exists.' });
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
            if (!currentUser.homeroomClass || currentUser.homeroomClass.toString() !== student.class.toString()) {
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
            if (!currentUser.homeroomClass || currentUser.homeroomClass.toString() !== student.class.toString()) {
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

// @desc    DeActive a student
// @route   POST /api/students/:id
exports.deactiveStudent = async (req, res) => {
    const {reason} = req.body;

    try {
        const currentUser = req.user;
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        if (currentUser.role === 'teacher') {
            if (!currentUser.homeroomClass || currentUser.homeroomClass.toString() !== student.class.toString()) {
                return res.status(403).json({ message: 'You are not authorized to delete this student.' });
            }
        } else if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to delete students.' });
        }
        student.status = reason; 
        await student.save();
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
            if (!currentUser.homeroomClass || currentUser.homeroomClass.toString() !== student.class.toString()) {
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
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet);

        if (!rows.length) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'The Excel file is empty.' });
        }

        const currentYear = new Date().getFullYear();
        const results = [];
        let created = 0, skipped = 0, errors = 0;

        for (const [index, row] of rows.entries()) {
            try {
                // 1. Resolve Full Name
                let fullName = row['Full Name'] || row['Name'];
                if (!fullName && (row['First Name'] || row['Last Name'])) {
                    fullName = [row['First Name'], row['Middle Name'], row['Last Name']].filter(Boolean).join(' ');
                }
                if (!fullName) {
                    results.push({ row: index + 2, status: 'error', reason: 'Missing name columns' });
                    errors++;
                    continue;
                }
                fullName = capitalizeName(fullName);

                // 2. Resolve Gender
                let gender = row['Gender'] || row['Sex'] || 'Other';
                if (gender.toString().toLowerCase().startsWith('m')) gender = 'Male';
                else if (gender.toString().toLowerCase().startsWith('f')) gender = 'Female';

                // 3. Resolve Class and Stream
                let rawClass = (row['Class'] || row['Grade Level'] || row['Grade'] || '').toString().trim();
                let rawStream = (row['Stream'] || row['Section'] || '').toString().trim();

                if (!rawClass) {
                    results.push({ row: index + 2, status: 'error', reason: 'Missing class/grade column' });
                    errors++;
                    continue;
                }

                // Smart Resolution: If Class contains a space (e.g., "P.7 S"), split it
                if (!rawStream && rawClass.includes(' ')) {
                    const parts = rawClass.split(/\s+/);
                    if (parts.length === 2 && parts[1].length === 1) {
                        rawClass = parts[0];
                        rawStream = parts[1];
                    }
                } else if (!rawStream && rawClass.length > 2) {
                    // Try to catch "P.7S" (split last char if it's a letter)
                    const lastChar = rawClass.slice(-1).toUpperCase();
                    if (/[A-Z]/.test(lastChar) && !isNaN(rawClass.slice(-2, -1))) {
                        rawClass = rawClass.slice(0, -1);
                        rawStream = lastChar;
                    }
                }

                // Helper: normalize for matching (P.7 -> P7)
                const normalize = (s) => s.toString().replace(/[\s\.]/g, '').toUpperCase();

                // Try to find the class (exact, then normalized e.g. P.7 -> P7)
                let cls = await Class.findOne({ className: { $regex: new RegExp(`^${rawClass}$`, 'i') } });
                if (!cls) {
                    const allClasses = await Class.find({});
                    cls = allClasses.find(c => normalize(c.className) === normalize(rawClass));
                }

                if (!cls) {
                    results.push({ row: index + 2, status: 'error', reason: `Class "${rawClass}" not found in database` });
                    errors++;
                    continue;
                }

                // 5. Find Stream in DB
                const allStreams = await Stream.find({ classId: cls._id });
                let stmId = null;
                if (rawStream) {
                    const stm = allStreams.find(s => normalize(s.streamName) === normalize(rawStream));
                    if (stm) stmId = stm._id;
                }
                if (!stmId) {
                    if (allStreams.length === 1) {
                        stmId = allStreams[0]._id;
                    } else {
                        results.push({ row: index + 2, status: 'error', reason: `Stream "${rawStream || 'None'}" not found in ${cls.className}. Available: ${allStreams.map(s => s.streamName).join(', ')}` });
                        errors++;
                        continue;
                    }
                }

                // 6. Duplicate check — if exists, update stream
                let student = await Student.findOne({ fullName, class: cls._id });
                if (student) {
                    student.stream = stmId;
                    await student.save();
                    results.push({ row: index + 2, status: 'updated', fullName, message: `Updated stream` });
                    created++;
                    continue;
                }

                // 7. Create new student
                const initialPassword = `${getFirstName(fullName)}@${currentYear}`;
                const newStudent = new Student({
                    fullName,
                    gender,
                    dateOfBirth: parseExcelDate(row['Date of Birth'] || row['DOB']),
                    class: cls._id,
                    stream: stmId,
                    motherName: row['Mother Name'] || '',
                    motherContact: row['Mother Contact'] || row['Parent Phone'] || '',
                    fatherContact: row['Father Contact'] || '',
                    password: initialPassword,
                    healthStatus: row['Health Status'] || 'Normal'
                });

                await newStudent.save();
                results.push({ row: index + 2, status: 'created', fullName, studentId: newStudent.studentId });
                created++;

            } catch (rowErr) {
                results.push({ row: index + 2, status: 'error', reason: rowErr.message });
                errors++;
            }
        }

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(201).json({
            success: true,
            message: `Import complete: ${created} created, ${results.filter(r => r.status === 'updated').length} updated, ${errors} errors.`,
            summary: { 
                created: results.filter(r => r.status === 'created').length,
                updated: results.filter(r => r.status === 'updated').length,
                skipped: results.filter(r => r.status === 'skipped').length,
                errors 
            },
            results
        });

    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ message: 'Error processing file', error: err.message });
    }
};

exports.resetPassword = async (req,res)=>{
    const _id = req.params.studentId;

    try {
        const student = await Student.findById(_id).select('+password');
        if(!student) return res.status(404).json({message:"No Student found with this ID"});
        
        const currentUser = req.user;
        if (currentUser.role === 'teacher') {
            if (!currentUser.homeroomClass || currentUser.homeroomClass.toString() !== student.class.toString()) {
                return res.status(403).json({ message: 'You are not authorized to reset this student\'s password.' });
            }
        } else if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to reset student passwords.' });
        }
        
        const password = `123456`
        
        student.password = password;
        student.isInitialPassword = true;


        await student.save();

        res.status(200).json({ success: true, message: 'Password reset successfully.' });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({message: error.message})
    }
}



// 1. Search for existing student by ID
exports.getStudentForRegistration = async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.studentId });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        // Return only what the user needs to see for verification
        res.json({
            _id: student._id,
            studentId: student.studentId,
            fullName: student.fullName,
            class: student.class,
            stream: student.stream,
            thatYear: student.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Process the "New" Registration
exports.reRegisterStudent = async (req, res) => {
    const { studentId, newClassId, newStreamId, thatYear} = req.body;

    const acadamicYear = getCurrentEthDate(thatYear)


    try {
        const student = await Student.findOne({ studentId });

        if (!student) return res.status(404).json({ message: "Student not found" });

        const historyEntry = {
            year: acadamicYear,
            classAtThatTime: student.class,
            streamAtThatTime: student.stream,
            statusAtEnd: 'Completed'
        };

        // B. Update the student for the NEW year
        student.academicHistory.push(historyEntry);
        student.class = newClassId;
        student.stream = newStreamId;
        student.status = 'Active'; 
        
        await student.save();

        res.json({ message: `${student.fullName} successfully registered for the new year.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};