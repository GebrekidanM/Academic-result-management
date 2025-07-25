const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const AssessmentType = require('../models/AssessmentType');


exports.protect = async (req, res, next) => {
    let token;

    // Check if the token is sent in the headers and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (e.g., "Bearer eyJhbGci...")
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token's ID and attach it to the request object
            // We exclude the password when fetching the user
             req.user = await User.findById(decoded.id).select('-password').populate('subjectsTaught.subject');

            next(); // Move to the next middleware or the actual route controller
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to check for specific roles (e.g., admin)
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role '${req.user.role}' is not authorized to access this route` 
            });
        }
        next();
    };
};


// It checks if a user is an admin OR a teacher assigned to the requested subject.
exports.isTeacherForSubject = (req, res, next) => {
    // Admins are always authorized. Your 'authorize('admin')' middleware can also handle this,
    // but checking here makes this function self-contained.
    if (req.user.role === 'admin') {
        return next();
    }
    
    if (req.user.role === 'teacher') {
        // Get the subject ID from the request (works for query params or request body)
        const subjectId = req.query.subjectId || req.body.subjectId;

        if (!subjectId) {
            return res.status(400).json({ message: 'Bad Request: Subject ID is required for this action.' });
        }

        // Check if the teacher's 'subjectsTaught' array contains the requested subjectId
        const isAuthorized = req.user.subjectsTaught.some(
            assignment => assignment.subject && assignment.subject._id.toString() === subjectId
        );

        if (isAuthorized) {
            return next(); // Yes, they are authorized. Proceed.
        } else {
            return res.status(403).json({ message: 'Forbidden: You are not assigned to teach this subject.' });
        }
    }
};

exports.isHomeroomTeacherOrAdmin = (req, res, next) => {
    const requestedGradeLevel = req.query.gradeLevel;
    if (!requestedGradeLevel) {
        return res.status(400).json({ message: 'Grade Level is required.' });
    }

    const { role, homeroomGrade } = req.user;

    // Admins are always allowed.
    if (role === 'admin') {
        return next();
    }

    // A user is a valid homeroom teacher if their role is 'teacher',
    // they have a 'homeroomGrade' defined, AND it matches the requested grade.
    if (role === 'teacher' && homeroomGrade && homeroomGrade === requestedGradeLevel) {
        return next();
    }

    return res.status(403).json({ message: 'Forbidden: You are not the homeroom teacher for this grade.' });
};
exports.isHomeroomTeacherForStudent = async (req, res, next) => {
    // Admins are always authorized.
    if (req.user.role === 'admin') {
        return next();
    }

    // Get the student's ID from the request body or params
    const studentId = req.body.studentId || req.params.studentId;
    if (!studentId) {
        // For updates/deletes, we might need to fetch the report first
        if (req.params.reportId) {
            const report = await behavioralReportService.getReportById(req.params.reportId);
            if(report) studentId = report.student.toString();
        }
        if (!studentId) return res.status(400).json({ message: 'Student ID is required.' });
    }

    // Fetch the student's document to see their grade level
    const student = await Student.findById(studentId);
    if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
    }

    // Check if the logged-in user is a teacher and their homeroomGrade matches the student's gradeLevel
    if (
        req.user.role === 'teacher' && 
        req.user.homeroomGrade &&
        req.user.homeroomGrade === student.gradeLevel
    ) {
        return next(); // Authorized!
    }

    return res.status(403).json({ message: 'Forbidden: You are not the homeroom teacher for this student.' });
};

exports.protectStudent = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check that this is a 'student' type token
            if (decoded.type !== 'student') {
                return res.status(401).json({ message: 'Not authorized, invalid token type' });
            }
            
            // Attach the student object to the request
            req.student = await Student.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) res.status(401).json({ message: 'Not authorized, no token' });
};

// This checks if the user is a staff member OR the parent of the requested student.
exports.canViewStudentData = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.type === 'user') {
                const user = await User.findById(decoded.id).populate('subjectsTaught.subject');
                
                if (!user) {
                    return res.status(401).json({ message: 'User not found.' });
                }
                req.user = user;

                if (user.role === 'admin') {
                    return next();
                }

                if (user.role === 'teacher') {
                    const requestedStudentId = req.params.id || req.params.studentId;
                    
                    const student = await Student.findById(requestedStudentId);
                    if (!student) {
                        return res.status(404).json({ message: 'Student not found.' });
                    }

                    const isAuthorized = user.subjectsTaught.some(
                        assignment => assignment.subject && assignment.subject.gradeLevel === student.gradeLevel
                    );

                    if (isAuthorized) {
                        return next();
                    }
                }
            }
            
            if (decoded.type === 'student') {
                console.log("3b. Token type is 'student'. Checking permissions...");
                const requestedStudentId = req.params.id || req.params.studentId;
                console.log(`   - Requested Student ID: ${requestedStudentId}`);
                console.log(`   - Student ID from Token: ${decoded.id}`);

                if (decoded.id === requestedStudentId) {
                    console.log("SUCCESS: Parent/Student ID matches. Granting access.");
                    return next();
                }
            }

            console.error("FAILURE: No authorization rule was met. Denying access.");
            return res.status(403).json({ message: 'Forbidden: You do not have permission to view this data.' });

        } catch (error) {
            console.error("CRITICAL ERROR in middleware:", error);
            return res.status(401).json({ message: 'Not authorized, token is invalid.' });
        }
    }
    
    console.error("FAILURE: No token provided. Denying access.");
    return res.status(401).json({ message: 'Not authorized, no token provided.' });
};

exports.authorizeAnalytics = async (req, res, next) => {
    try {
        const { assessmentTypeId } = req.query;
        if (!assessmentTypeId) return res.status(400).json({ message: 'Assessment Type ID is required.' });

        // Step 1: Find the assessment and its subject
        const assessmentType = await AssessmentType.findById(assessmentTypeId).select('subject');
        if (!assessmentType) return res.status(404).json({ message: 'Assessment Type not found.' });
        
        const subjectId = assessmentType.subject.toString();

        // Step 2: Check the user's role and permissions
        const user = req.user; // Get the user from the 'protect' middleware
        
        if (user.role === 'admin') {
            return next();
        }

        if (user.role === 'teacher') {
            const teacherSubjectIds = user.subjectsTaught.map(a => a.subject?._id.toString());
            
            if (teacherSubjectIds.includes(subjectId)) {
                return next();
            }
        }
        
        return res.status(403).json({ message: 'Forbidden: You are not authorized to view this analysis.' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};