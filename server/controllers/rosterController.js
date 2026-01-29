const User = require('../models/User');
const Subject = require('../models/Subject');
const SupportiveSubject = require('../models/SupportiveSubject'); // <--- IMPORT
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const SupportiveGrade = require('../models/SupportiveGrade'); // <--- IMPORT
const AssessmentType = require('../models/AssessmentType')

// --- 1. HELPER: ETHIOPIAN AGE CALCULATOR ---
const calculateAge = require('../utils/calculateAge')
// --- SUBJECT ORDER CONFIG ---
const SUBJECT_ORDER = [
    "አማርኛ", "English",  "ሒሳብ", 
    "አካባቢ ሳይንስ", "General Science","Affan Oromo","ህብረተሰብ","Social Studies", 
    "ግብረ ገብ", "ICT", "ጤሰማ","ሙያ", 
    "ስነጥበብ","Mathematics", "Spoken", "Grammer"
];

// =====================================================
// MAIN ROSTER GENERATOR
// =====================================================
exports.generateRoster = async (req, res) => {
    const { gradeLevel, academicYear } = req.query;

    if (!gradeLevel || !academicYear) {
        return res.status(400).json({ message: 'Grade Level and Academic Year are required.' });
    }

    try {
        const homeroomTeacher = await User.findOne({ homeroomGrade: gradeLevel }).select('fullName');

        const academicSubjects = await Subject.find({ gradeLevel }).lean();
        const supportiveSubjects = await SupportiveSubject.find({ gradeLevel }).lean();

        const students = await Student.find({ gradeLevel, status: 'Active' })
            .select('studentId fullName gender dateOfBirth')
            .sort({ fullName: 1 });

        if (!students.length) {
            return res.status(404).json({ message: 'No active students found.' });
        }

        const studentIds = students.map(s => s._id);

        const [academicGrades, supportiveGrades] = await Promise.all([
            Grade.find({ student: { $in: studentIds }, academicYear })
                .populate('subject', 'name'),
            SupportiveGrade.find({ student: { $in: studentIds }, academicYear })
                .populate('subject', 'name')
        ]);

        const rosterData = students.map(student => {
            const firstSemester = { scores: {}, total: 0, count: 0 };
            const secondSemester = { scores: {}, total: 0, count: 0 };
            const subjectAverages = {};

            // ---------- ACADEMIC SUBJECTS ----------
            academicSubjects.forEach(subject => {
                const g1 = academicGrades.find(
                    g => g.student.equals(student._id) &&
                         g.subject?._id.equals(subject._id) &&
                         g.semester === 'First Semester'
                );

                const g2 = academicGrades.find(
                    g => g.student.equals(student._id) &&
                         g.subject?._id.equals(subject._id) &&
                         g.semester === 'Second Semester'
                );

                const s1 = g1 ? Number(g1.finalScore) : null;
                const s2 = g2 ? Number(g2.finalScore) : null;

                firstSemester.scores[subject.name] = s1 ?? '-';
                secondSemester.scores[subject.name] = s2 ?? '-';

                if (s1 !== null) {
                    firstSemester.total += s1;
                    firstSemester.count++;
                }

                if (s2 !== null) {
                    secondSemester.total += s2;
                    secondSemester.count++;
                }

                const valid = [s1, s2].filter(v => v !== null);
                subjectAverages[subject.name] =
                    valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
            });

            // ---------- SUPPORTIVE SUBJECTS ----------
            supportiveSubjects.forEach(subject => {
                const g1 = supportiveGrades.find(
                    g => g.student.equals(student._id) &&
                         g.subject?._id.equals(subject._id) &&
                         g.semester === 'First Semester'
                );

                const g2 = supportiveGrades.find(
                    g => g.student.equals(student._id) &&
                         g.subject?._id.equals(subject._id) &&
                         g.semester === 'Second Semester'
                );

                firstSemester.scores[subject.name] = g1 ? g1.score : '-';
                secondSemester.scores[subject.name] = g2 ? g2.score : '-';
                subjectAverages[subject.name] = '-';
            });

            // ---------- AVERAGES ----------
            firstSemester.average = firstSemester.count
                ? firstSemester.total / firstSemester.count
                : 0;

            secondSemester.average = secondSemester.count
                ? secondSemester.total / secondSemester.count
                : 0;

            const semestersUsed =
                (firstSemester.count > 0) + (secondSemester.count > 0);

            const overallAverage = semestersUsed
                ? (firstSemester.average + secondSemester.average) / semestersUsed
                : 0;

            return {
                studentId: student.studentId,
                fullName: student.fullName,
                gender: student.gender,
                age: calculateAge(student.dateOfBirth),

                firstSemester: {
                    scores: Object.fromEntries(
                        Object.entries(firstSemester.scores).map(([k, v]) => [
                            k,
                            typeof v === 'number' ? v.toFixed(2) : v
                        ])
                    ),
                    total: firstSemester.total.toFixed(2),
                    count: firstSemester.count,
                    average: firstSemester.average.toFixed(2)
                },

                secondSemester: {
                    scores: Object.fromEntries(
                        Object.entries(secondSemester.scores).map(([k, v]) => [
                            k,
                            typeof v === 'number' ? v.toFixed(2) : v
                        ])
                    ),
                    total: secondSemester.total.toFixed(2),
                    count: secondSemester.count,
                    average: secondSemester.average.toFixed(2)
                },

                subjectAverages: Object.fromEntries(
                    Object.entries(subjectAverages).map(([k, v]) => [
                        k,
                        typeof v === 'number' ? v.toFixed(2) : v
                    ])
                ),

                overallTotal: (firstSemester.total + secondSemester.total).toFixed(2),
                overallAverage: overallAverage.toFixed(2),

                rank1st: '-',
                rank2nd: '-',
                overallRank: '-'
            };
        });

        // ---------- RANKING ----------
        const rankBy = (key, rankField, countKey) => {
            rosterData
                .filter(r => r[countKey] > 0)
                .sort((a, b) => b[key] - a[key])
                .forEach((r, i) => r[rankField] = i + 1);
        };

        rankBy('firstSemester.average', 'rank1st', 'firstSemester.count');
        rankBy('secondSemester.average', 'rank2nd', 'secondSemester.count');
        rankBy('overallAverage', 'overallRank', 'overallAverage');

        rosterData.sort((a, b) => a.fullName.localeCompare(b.fullName));

        res.json({
            subjects: [...academicSubjects, ...supportiveSubjects].map(s => s.name),
            roster: rosterData,
            homeroomTeacherName: homeroomTeacher?.fullName || 'Not Assigned'
        });

    } catch (error) {
        console.error('Roster generation error:', error);
        res.status(500).json({ message: 'Server error while generating roster' });
    }
};


// @desc    Generate a detailed roster for a single subject
// @route   GET /api/rosters/subject-details?gradeLevel=...&subjectId=...&semester=...&academicYear=...
// in backend/controllers/rosterController.js

exports.generateSubjectRoster = async (req, res) => {
    const { gradeLevel, subjectId, semester, academicYear } = req.query;

    if (!gradeLevel || !subjectId || !semester || !academicYear) {
        return res.status(400).json({ message: 'Grade Level, Subject, Semester, and Year are required.' });
    }
    
    try {
        const allAssessmentsForSubject = await AssessmentType.find({ subject: subjectId, gradeLevel ,year:academicYear}).sort({ name: 1 });
        if (allAssessmentsForSubject.length === 0) {
            return res.status(404).json({ message: 'No assessment types found for this subject.' });
        }

        const MONTH_ORDER = ["September", "October", "November", "December", "January", "February", "March", "April", "May", "June"];
        const assessmentTypesByMonth = {};
        allAssessmentsForSubject.forEach(at => {
            if (!assessmentTypesByMonth[at.month]) assessmentTypesByMonth[at.month] = [];
            assessmentTypesByMonth[at.month].push(at);
        });
        
        const sortedMonths = Object.keys(assessmentTypesByMonth).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
        const students = await Student.find({ gradeLevel, status: 'Active' })
            .select('studentId fullName gender dateOfBirth')
            .sort({ fullName: 1 });

        if (students.length === 0) return res.status(404).json({ message: 'No active students found.' });
        
        const studentIds = students.map(s => s._id);
        const grades = await Grade.find({ student: { $in: studentIds }, subject: subjectId, semester, academicYear }).populate('assessments.assessmentType');

        const rosterData = students.map(student => {
            const studentDetailedScores = {};
            const gradeDoc = grades.find(g => g.student.equals(student._id));

            allAssessmentsForSubject.forEach(at => {
                let score = '-';
                if (gradeDoc) {
                    // --- THIS IS THE CRITICAL SAFETY CHECK ---
                    // We check if 'a.assessmentType' exists before trying to access its properties
                    const assessment = gradeDoc.assessments.find(a => 
                        a.assessmentType && a.assessmentType._id.equals(at._id)
                    );
                    if (assessment) score = assessment.score;
                }
                studentDetailedScores[at._id.toString()] = score;
            });

            return {
                studentId: student.studentId, 
                fullName: student.fullName,
                gender: student.gender,
                age: calculateAge(student.dateOfBirth),
                detailedScores: studentDetailedScores,
                finalScore: gradeDoc ? parseFloat(gradeDoc.finalScore.toFixed(2)) : '-',
            };
        });

        res.status(200).json({
            sortedMonths: sortedMonths,
            assessmentsByMonth: assessmentTypesByMonth,
            roster: rosterData
        });

    } catch (error) {
        console.error('Error generating subject roster:', error);
        res.status(500).json({ message: 'Server error while generating roster' });
    }
};