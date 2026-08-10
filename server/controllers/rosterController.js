// server/controllers/rosterController.js
const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const SupportiveGrade = require('../models/SupportiveGrade'); 
const AssessmentType = require('../models/AssessmentType');
const User = require('../models/User');
const Subject = require("../models/Subject");
const SupportiveSubject = require('../models/SupportiveSubject'); 
const GradeLevel = require('../models/GradeLevel'); 
const calculateAge = require('../utils/calculateAge');

const SUBJECT_ORDER = [
    "አማርኛ", "English", "ሒሳብ", "አካባቢ ሳይንስ", "ግብረ ገብ", "ጤሰማ", "Affan Oromo", "ስነጥበብ",
    "General Science", "Mathematics", "Social Studies", "Civics", "ICT", "HPE", "Art", "Spoken", "Grammar"
];

const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// @desc    Generate annual class roster
// @route   GET /api/rosters?gradeLevel=...&academicYear=...
exports.generateRoster = async (req, res) => {
    const { gradeLevel, academicYear } = req.query;

    if (!gradeLevel || !academicYear) {
        return res.status(400).json({ message: 'Grade Level and Academic Year are required.' });
    }

    try {
        // --- 1. RESOLVE GRADE LEVEL OBJECTID ---
        let targetGradeId = null;
        let targetGradeName = gradeLevel;

        if (mongoose.Types.ObjectId.isValid(gradeLevel) && gradeLevel.length === 24) {
            targetGradeId = new mongoose.Types.ObjectId(gradeLevel);
            const gradeDoc = await GradeLevel.findById(targetGradeId);
            if (gradeDoc) targetGradeName = gradeDoc.name;
        } else {
            const gradeDoc = await GradeLevel.findOne({ name: gradeLevel })
                .collation({ locale: 'en', strength: 2 });
            if (gradeDoc) {
                targetGradeId = gradeDoc._id;
                targetGradeName = gradeDoc.name;
            }
        }

        if (!targetGradeId) {
            return res.status(404).json({ message: `Grade level "${gradeLevel}" not found.` });
        }

        const homeroomTeacher = await User.findOne({ homeroomGrade: targetGradeId }).select('fullName');
        
        const academicSubjects = await Subject.find({ 'gradeLevels.gradeLevel': targetGradeId }).sort({ name: 1 }).lean();
        const supportiveSubjects = await SupportiveSubject.find({ gradeLevel: targetGradeId }).sort({ name: 1 }).lean();

        if (academicSubjects.length === 0 && supportiveSubjects.length === 0) {
            return res.status(404).json({ message: 'No subjects found for this grade level.' });
        }

        const studentQuery = {
            $or: [
                { year: academicYear, gradeLevel: targetGradeId },
                {
                    academicHistory: {
                        $elemMatch: {
                            year: academicYear,
                            gradeAtThatTime: { $in: [targetGradeId.toString(), targetGradeName] }
                        }
                    }
                }
            ]
        };

        const students = await Student.find(studentQuery)
            .select('studentId fullName gender dateOfBirth _id')
            .sort({ fullName: 1 });
        
        if (students.length === 0) return res.status(404).json({ message: 'No active students found.' });
        
        const studentIds = students.map(s => s._id);
        const yearFilter = { $in: [academicYear, String(academicYear), Number(academicYear)] };

        const [academicGrades, supportiveGrades] = await Promise.all([
            Grade.find({ student: { $in: studentIds }, academicYear: yearFilter }).populate('subject', 'name'),
            SupportiveGrade.find({ student: { $in: studentIds }, academicYear: yearFilter }).populate('subject', 'name')
        ]);

        // --- DUAL LOOKUP MAP (Stores keys by both Subject Name AND Subject ID) ---
        const academicGradeMap = new Map();
        academicGrades.forEach(g => {
            const studentIdStr = g.student ? (g.student._id || g.student).toString() : '';
            const subjectNameStr = g.subject && g.subject.name ? g.subject.name.toLowerCase().trim() : '';
            const subjectIdStr = g.subject ? (g.subject._id || g.subject).toString() : '';
            const semStr = (g.semester || '').trim().toLowerCase();

            if (studentIdStr && semStr) {
                // Key 1: By Subject Name (e.g. "6976e8e5..._english_first semester")
                if (subjectNameStr) {
                    academicGradeMap.set(`${studentIdStr}_${subjectNameStr}_${semStr}`, g.finalScore);
                }
                // Key 2: By Subject ID as fallback
                if (subjectIdStr) {
                    academicGradeMap.set(`${studentIdStr}_${subjectIdStr}_${semStr}`, g.finalScore);
                }
            }
        });

        const supportiveGradeMap = new Map();
        supportiveGrades.forEach(g => {
            const studentIdStr = g.student ? (g.student._id || g.student).toString() : '';
            const subjectNameStr = g.subject && g.subject.name ? g.subject.name.toLowerCase().trim() : '';
            const subjectIdStr = g.subject ? (g.subject._id || g.subject).toString() : '';
            const semStr = (g.semester || '').trim().toLowerCase();

            if (studentIdStr && semStr) {
                if (subjectNameStr) {
                    supportiveGradeMap.set(`${studentIdStr}_${subjectNameStr}_${semStr}`, g.score);
                }
                if (subjectIdStr) {
                    supportiveGradeMap.set(`${studentIdStr}_${subjectIdStr}_${semStr}`, g.score);
                }
            }
        });

        let rosterData = students.map(student => {
            const firstSemester = { scores: {}, total: 0, count: 0 };
            const secondSemester = { scores: {}, total: 0, count: 0 };
            const subjectAverages = {};

            // A. Process ACADEMIC SUBJECTS
            academicSubjects.forEach(subject => {
                const subNameKey = subject.name.toLowerCase().trim();
                const subIdKey = subject._id.toString();

                // Build lookup keys for both Name and ID
                const key1stName = `${student._id.toString()}_${subNameKey}_first semester`;
                const key1stId   = `${student._id.toString()}_${subIdKey}_first semester`;

                const key2ndName = `${student._id.toString()}_${subNameKey}_second semester`;
                const key2ndId   = `${student._id.toString()}_${subIdKey}_second semester`;

                // Try Name first, fallback to ID
                const val1 = academicGradeMap.has(key1stName) 
                    ? academicGradeMap.get(key1stName) 
                    : (academicGradeMap.has(key1stId) ? academicGradeMap.get(key1stId) : null);

                const val2 = academicGradeMap.has(key2ndName) 
                    ? academicGradeMap.get(key2ndName) 
                    : (academicGradeMap.has(key2ndId) ? academicGradeMap.get(key2ndId) : null);

                if (val1 !== null) {
                    firstSemester.total += val1;
                    firstSemester.count++;
                    firstSemester.scores[subject.name] = roundToTwo(val1);
                } else {
                    firstSemester.scores[subject.name] = '-';
                }

                if (val2 !== null) {
                    secondSemester.total += val2;
                    secondSemester.count++;
                    secondSemester.scores[subject.name] = roundToTwo(val2);
                } else {
                    secondSemester.scores[subject.name] = '-';
                }
                
                const validScores = [val1, val2].filter(s => s !== null);
                const avg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
                subjectAverages[subject.name] = avg !== null ? roundToTwo(avg) : '-';
            });

            // B. Process SUPPORTIVE SUBJECTS
            supportiveSubjects.forEach(subject => {
                const subNameKey = subject.name.toLowerCase().trim();
                const subIdKey = subject._id.toString();

                const key1stName = `${student._id.toString()}_${subNameKey}_first semester`;
                const key1stId   = `${student._id.toString()}_${subIdKey}_first semester`;

                const key2ndName = `${student._id.toString()}_${subNameKey}_second semester`;
                const key2ndId   = `${student._id.toString()}_${subIdKey}_second semester`;

                const score1st = supportiveGradeMap.get(key1stName) || supportiveGradeMap.get(key1stId) || '-';
                const score2nd = supportiveGradeMap.get(key2ndName) || supportiveGradeMap.get(key2ndId) || '-';

                firstSemester.scores[subject.name] = score1st;
                secondSemester.scores[subject.name] = score2nd;
                subjectAverages[subject.name] = '-';
            });
            
            // C. Averages Calculation
            firstSemester.average = firstSemester.count > 0 ? roundToTwo(firstSemester.total / firstSemester.count) : 0;
            secondSemester.average = secondSemester.count > 0 ? roundToTwo(secondSemester.total / secondSemester.count) : 0;

            let overallAvgCalc = 0;
            let divisor = 0;
            if (firstSemester.count > 0) { overallAvgCalc += firstSemester.average; divisor++; }
            if (secondSemester.count > 0) { overallAvgCalc += secondSemester.average; divisor++; }
            const overallAverage = divisor > 0 ? roundToTwo(overallAvgCalc / divisor) : 0;
            
            const overallTotalSum = firstSemester.total + secondSemester.total;
            const overallTotalSumAvg = divisor > 0 ? roundToTwo(overallTotalSum / divisor) : roundToTwo(overallTotalSum);

            return {
                _id: student._id,
                studentId: student.studentId, 
                fullName: student.fullName,
                gender: student.gender,
                age: typeof calculateAge === 'function' ? calculateAge(student.dateOfBirth) : 'N/A',
                
                firstSemester: {
                    scores: firstSemester.scores,
                    total: roundToTwo(firstSemester.total),
                    count: firstSemester.count,
                    average: firstSemester.average,
                },

                secondSemester: {
                    scores: secondSemester.scores,
                    total: roundToTwo(secondSemester.total),
                    count: secondSemester.count,
                    average: secondSemester.average,
                },

                subjectAverages: subjectAverages,

                overallTotal: overallTotalSumAvg, 
                overallAverage: overallAverage,
                rank1st: '-', rank2nd: '-', overallRank: '-',
            };
        });
        
        // --- RANKING LOGIC ---
        rosterData.sort((a, b) => b.firstSemester.average - a.firstSemester.average);
        let currentRank = 1;
        for (let i = 0; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].firstSemester.average < rosterData[i - 1].firstSemester.average) {
                currentRank = i + 1;
            }
            rosterData[i].rank1st = rosterData[i].firstSemester.count > 0 ? currentRank : '-';
        }

        rosterData.sort((a, b) => b.secondSemester.average - a.secondSemester.average);
        currentRank = 1;
        for (let i = 0; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].secondSemester.average < rosterData[i - 1].secondSemester.average) {
                currentRank = i + 1;
            }
            rosterData[i].rank2nd = rosterData[i].secondSemester.count > 0 ? currentRank : '-';
        }

        rosterData.sort((a, b) => b.overallAverage - a.overallAverage);
        currentRank = 1;
        for (let i = 0; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].overallAverage < rosterData[i - 1].overallAverage) {
                currentRank = i + 1;
            }
            const hasAnyGrades = (rosterData[i].firstSemester.count + rosterData[i].secondSemester.count) > 0;
            rosterData[i].overallRank = hasAnyGrades ? currentRank : '-';
        }
        
        // --- SORT SUBJECT COLUMNS ---
        academicSubjects.sort((a, b) => {
            const indexA = SUBJECT_ORDER.indexOf(a.name);
            const indexB = SUBJECT_ORDER.indexOf(b.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(b.name);
        });

        supportiveSubjects.sort((a, b) => a.name.localeCompare(b.name));

        const allSubjects = [...academicSubjects, ...supportiveSubjects];
        const subjectNames = allSubjects.map(s => s.name);

        rosterData.sort((a, b) => a.fullName.localeCompare(b.fullName));

        res.status(200).json({ 
            subjects: subjectNames, 
            roster: rosterData,
            homeroomTeacherName: homeroomTeacher ? homeroomTeacher.fullName : 'Not Assigned'
        });

    } catch (error) {
        console.error("Roster generation error:", error);
        res.status(500).json({ message: 'Server error while generating roster' });
    }
};

// @desc    Generate a detailed roster for a single subject
// @route   GET /api/rosters/subject-details?gradeLevel=...&subjectId=...&semester=...&academicYear=...
exports.generateSubjectRoster = async (req, res) => {
    const { gradeLevel, subjectId, semester, academicYear } = req.query;
    
    if (!gradeLevel || !subjectId || !semester || !academicYear) {
        return res.status(400).json({ message: 'Grade Level, Subject, Semester, and Year are required.' });
    }

    const SEMESTER_CONFIG = {
        "First Semester": ["September", "October", "November", "December", "January"],
        "Second Semester": ["February", "March", "April", "May", "June"]
    };

    const validMonths = SEMESTER_CONFIG[semester];
    if (!validMonths) {
        return res.status(400).json({ message: 'Invalid semester provided.' });
    }

    try {
        let targetGradeId = null;
        let targetGradeName = gradeLevel;

        if (mongoose.Types.ObjectId.isValid(gradeLevel) && gradeLevel.length === 24) {
            targetGradeId = new mongoose.Types.ObjectId(gradeLevel);
            const gradeDoc = await GradeLevel.findById(targetGradeId);
            if (gradeDoc) targetGradeName = gradeDoc.name;
        } else {
            const gradeDoc = await GradeLevel.findOne({ name: gradeLevel })
                .collation({ locale: 'en', strength: 2 });
            if (gradeDoc) {
                targetGradeId = gradeDoc._id;
                targetGradeName = gradeDoc.name;
            }
        }

        if (!targetGradeId) {
            return res.status(404).json({ message: `Grade level "${gradeLevel}" not found.` });
        }

        const validSubjectId = mongoose.Types.ObjectId.isValid(subjectId) && subjectId.length === 24
            ? new mongoose.Types.ObjectId(subjectId)
            : subjectId;

        const allAssessmentsForSubject = await AssessmentType.find({ 
            subject: validSubjectId, 
            gradeLevel: targetGradeId,
            year: { $in: [academicYear, Number(academicYear)] },
            semester: semester,
            month: { $in: validMonths } 
        }).populate('name','name');

        if (allAssessmentsForSubject.length === 0) {
            return res.status(404).json({ message: 'No assessment types found for this semester.' });
        }

        const assessmentTypesByMonth = {};
        allAssessmentsForSubject.forEach(at => {
            if (!assessmentTypesByMonth[at.month]) assessmentTypesByMonth[at.month] = [];
            assessmentTypesByMonth[at.month].push(at);
        });

        const sortedMonths = validMonths.filter(m => assessmentTypesByMonth[m]);

        const studentQuery = {
            $or: [
                { year: academicYear, gradeLevel: targetGradeId },
                {
                    academicHistory: {
                        $elemMatch: {
                            year: academicYear,
                            gradeAtThatTime: { $in: [targetGradeId.toString(), targetGradeName] }
                        }
                    }
                }
            ]
        };

        const students = await Student.find(studentQuery)
            .select('_id studentId fullName gender dateOfBirth')
            .sort({ fullName: 1 });

        if (students.length === 0) return res.status(404).json({ message: 'No active students found.' });

        const studentIds = students.map(s => s._id);
        const grades = await Grade.find({ 
            student: { $in: studentIds }, 
            subject: validSubjectId, 
            semester, 
            academicYear 
        }).populate('assessments.assessmentType');

        const gradeMap = new Map();
        grades.forEach(g => gradeMap.set(g.student.toString(), g));

        const rosterData = students.map(student => {
            const studentDetailedScores = {};
            const gradeDoc = gradeMap.get(student._id.toString());

            allAssessmentsForSubject.forEach(at => {
                let score = '-';
                if (gradeDoc && gradeDoc.assessments) {
                    const assessment = gradeDoc.assessments.find(a => 
                        a.assessmentType && a.assessmentType._id.equals(at._id)
                    );
                    if (assessment) score = assessment.score;
                }
                studentDetailedScores[at._id.toString()] = score;
            });

            return {
                _id: student._id,
                studentId: student.studentId,
                fullName: student.fullName,
                gender: student.gender,
                age: typeof calculateAge === 'function' ? calculateAge(student.dateOfBirth) : 'N/A',
                detailedScores: studentDetailedScores,
                finalScore: gradeDoc ? roundToTwo(gradeDoc.finalScore) : '-',
            };
        });

        res.status(200).json({
            semester: semester,
            sortedMonths: sortedMonths,
            assessmentsByMonth: assessmentTypesByMonth,
            roster: rosterData
        });

    } catch (error) {
        console.error('Error generating subject roster:', error);
        res.status(500).json({ message: 'Server error while generating roster' });
    }
};