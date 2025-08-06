const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const AssessmentType = require('../models/AssessmentType');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

             req.user = await User.findById(decoded.id).select('-password').populate('subjectsTaught.subject');

            next(); // Move to the next middleware or the actual route controller
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

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
    if (req.user.role === 'admin') {
        return next();
    }
    
    if (req.user.role === 'teacher') {
        const subjectId = req.query.subjectId || req.body.subjectId;

        if (!subjectId) {
            return res.status(400).json({ message: 'Bad Request: Subject ID is required for this action.' });
        }

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

    if (role === 'admin') {
        return next();
    }

    if (role === 'teacher' && homeroomGrade && homeroomGrade === requestedGradeLevel) {
        return next();
    }

    return res.status(403).json({ message: 'Forbidden: You are not the homeroom teacher for this grade.' });
};
exports.isHomeroomTeacherForStudent = async (req, res, next) => {
    if (req.user.role === 'admin') {
        return next();
    }

    const studentId = req.body.studentId || req.params.studentId;
    if (!studentId) {
        if (req.params.reportId) {
            const report = await behavioralReportService.getReportById(req.params.reportId);
            if(report) studentId = report.student.toString();
        }
        if (!studentId) return res.status(400).json({ message: 'Student ID is required.' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
    }

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
            
            if (decoded.type !== 'student') {
                return res.status(401).json({ message: 'Not authorized, invalid token type' });
            }
            
            req.student = await Student.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) res.status(401).json({ message: 'Not authorized, no token' });
};

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
                const requestedStudentId = req.params.id || req.params.studentId;

                if (decoded.id === requestedStudentId) {
                    return next();
                }
            }

            return res.status(403).json({ message: 'Forbidden: You do not have permission to view this data.' });

        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token is invalid.' });
        }
    }
    
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