const User = require('../models/User');
const Subject = require('../models/Subject');
const SupportiveSubject = require('../models/SupportiveSubject'); 
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const SupportiveGrade = require('../models/SupportiveGrade'); 
const AssessmentType = require('../models/AssessmentType');
const calculateAge = require('../utils/calculateAge');

const SUBJECT_ORDER = [
    "አማርኛ", "English", "Mathematics", "ሒሳብ", 
    "አካባቢ ሳይንስ", "General Science", "Social Studies", 
    "Civics", "ግብረ ገብ", "ICT", "HPE", "ጤሰማ", 
    "Art", "ስነጥበብ", "Spoken", "Grammar", "Affan Oromo"
];

// Canonical test period names as stored in AssessmentType.name
const TEST_PERIODS = [
    { key: 'BOT', label: 'BOT', match: /beginning/i },
    { key: 'MT',  label: 'MT',  match: /mid/i        },
    { key: 'EOT', label: 'EOT', match: /end/i        },
];

const matchPeriod = (atName) => {
    for (const p of TEST_PERIODS) {
        if (p.match.test(atName)) return p.key;
    }
    return null;
};

exports.generateRoster = async (req, res) => {
    const { classId, streamId, academicYear } = req.query;

    if (!classId || !academicYear) {
        return res.status(400).json({ message: 'Class and Academic Year are required.' });
    }

    try {
        // ── Homeroom teacher ──────────────────────────────────────────────────
        const homeroomQuery = { homeroomClass: classId };
        if (streamId && streamId !== 'all') homeroomQuery.homeroomStream = streamId;
        const homeroomTeacher = await User.findOne(homeroomQuery).select('fullName');

        // ── Subjects ──────────────────────────────────────────────────────────
        const academicSubjects = await Subject.find({ class: classId }).sort({ name: 1 }).lean();
        const supportiveSubjects = await SupportiveSubject.find({ class: classId }).sort({ name: 1 }).lean();

        if (academicSubjects.length === 0 && supportiveSubjects.length === 0) {
            return res.status(404).json({ message: 'No subjects found.' });
        }

        // ── Students ──────────────────────────────────────────────────────────
        const studentQuery = { class: classId, status: 'Active' };
        if (streamId && streamId !== 'all') studentQuery.stream = streamId;

        const students = await Student.find(studentQuery)
            .select('studentId fullName gender dateOfBirth _id')
            .sort({ fullName: 1 });

        if (students.length === 0) return res.status(404).json({ message: 'No active students found.' });

        const studentIds = students.map(s => s._id);

        // ── Grades (all semesters/terms) ──────────────────────────────────────
        const [academicGrades, supportiveGrades] = await Promise.all([
            Grade.find({ student: { $in: studentIds }, academicYear })
                .populate('subject', 'name')
                .populate('assessments.assessmentType', 'name totalMarks'),
            SupportiveGrade.find({ student: { $in: studentIds }, academicYear })
                .populate('subject', 'name')
        ]);

        // ── Build roster ──────────────────────────────────────────────────────
        let rosterData = students.map(student => {
            // subjectScores[subjectName][periodKey] = score | null
            const subjectScores = {};
            const subjectAverages = {};

            // Period totals: { BOT: {total, count}, MT: ..., EOT: ... }
            const periodTotals = { BOT: { total: 0, count: 0 }, MT: { total: 0, count: 0 }, EOT: { total: 0, count: 0 } };

            academicSubjects.forEach(subject => {
                subjectScores[subject.name] = { BOT: null, MT: null, EOT: null };

                // Find all grade docs for this student + subject (may span multiple semesters)
                const gradeDocsForSubject = academicGrades.filter(g =>
                    g.student.equals(student._id) &&
                    g.subject?._id.equals(subject._id)
                );

                gradeDocsForSubject.forEach(gradeDoc => {
                    (gradeDoc.assessments || []).forEach(assessment => {
                        const atName = assessment.assessmentType?.name || '';
                        const periodKey = matchPeriod(atName);
                        if (!periodKey) return;
                        const score = assessment.score;
                        if (score !== null && score !== undefined) {
                            subjectScores[subject.name][periodKey] = score;
                        }
                    });
                });

                // Subject average across BOT, MT, EOT
                const vals = Object.values(subjectScores[subject.name]).filter(v => v !== null);
                subjectAverages[subject.name] = vals.length > 0
                    ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
                    : '-';

                // Accumulate period totals
                TEST_PERIODS.forEach(({ key }) => {
                    const v = subjectScores[subject.name][key];
                    if (v !== null) {
                        periodTotals[key].total += v;
                        periodTotals[key].count++;
                    }
                });
            });

            // Supportive subjects — just show score (no period breakdown)
            supportiveSubjects.forEach(subject => {
                const g = supportiveGrades.find(sg =>
                    sg.student.equals(student._id) && sg.subject?._id.equals(subject._id)
                );
                subjectScores[subject.name] = { BOT: null, MT: null, EOT: null };
                subjectAverages[subject.name] = g ? g.score : '-';
            });

            // Period averages (across all subjects)
            const periodAverages = {};
            TEST_PERIODS.forEach(({ key }) => {
                const { total, count } = periodTotals[key];
                periodAverages[key] = count > 0 ? parseFloat((total / count).toFixed(2)) : '-';
            });

            // Overall average = average of subject averages
            const numericSubjectAvgs = Object.values(subjectAverages).filter(v => typeof v === 'number');
            const overallAverage = numericSubjectAvgs.length > 0
                ? parseFloat((numericSubjectAvgs.reduce((a, b) => a + b, 0) / numericSubjectAvgs.length).toFixed(2))
                : 0;

            // Overall total = sum of subject averages
            const overallTotal = parseFloat(numericSubjectAvgs.reduce((a, b) => a + b, 0).toFixed(2));

            return {
                _id: student._id,
                studentId: student.studentId,
                fullName: student.fullName,
                gender: student.gender,
                age: calculateAge(student.dateOfBirth),
                subjectScores,       // [subjectName][BOT|MT|EOT]
                subjectAverages,     // [subjectName] = avg
                periodAverages,      // [BOT|MT|EOT] = avg across subjects
                overallAverage,
                overallTotal,
                overallRank: '-',
            };
        });

        // ── Ranking by overall average ────────────────────────────────────────
        rosterData.sort((a, b) => b.overallAverage - a.overallAverage);
        let currentRank = 1;
        for (let i = 0; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].overallAverage < rosterData[i - 1].overallAverage) currentRank = i + 1;
            rosterData[i].overallRank = rosterData[i].overallAverage > 0 ? currentRank : '-';
        }

        // ── Sort subjects ─────────────────────────────────────────────────────
        academicSubjects.sort((a, b) => {
            const iA = SUBJECT_ORDER.indexOf(a.name);
            const iB = SUBJECT_ORDER.indexOf(b.name);
            if (iA !== -1 && iB !== -1) return iA - iB;
            if (iA !== -1) return -1;
            if (iB !== -1) return 1;
            return a.name.localeCompare(b.name);
        });
        supportiveSubjects.sort((a, b) => a.name.localeCompare(b.name));

        const allSubjects = [...academicSubjects, ...supportiveSubjects];
        const subjectNames = allSubjects.map(s => s.name);

        rosterData.sort((a, b) => a.fullName.localeCompare(b.fullName));

        // Fetch class and stream names for the header
        const Class = require('../models/Class');
        const Stream = require('../models/Stream');
        const classDoc  = await Class.findById(classId).select('className').lean();
        const streamDoc = streamId && streamId !== 'all'
            ? await Stream.findById(streamId).select('streamName').lean()
            : null;

        res.status(200).json({
            subjects: subjectNames,
            testPeriods: TEST_PERIODS.map(p => ({ key: p.key, label: p.label })),
            roster: rosterData,
            homeroomTeacherName: homeroomTeacher ? homeroomTeacher.fullName : 'Not Assigned',
            className:  classDoc?.className  || '',
            streamName: streamDoc?.streamName || '',
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
    const { classId, streamId, subjectId, semester, academicYear } = req.query;

    // 1. Validation
    if (!classId || !subjectId || !semester || !academicYear) {
        return res.status(400).json({ message: 'Class, Subject, Semester, and Year are required.' });
    }

    // 2. Define Semester Logic
    // Adjust these arrays to match your school's actual academic calendar
    const SEMESTER_CONFIG = {
        "First Semester": ["September", "October", "November", "December", "January"],
        "Second Semester": ["February", "March", "April", "May", "June"]
    };

    const validMonths = SEMESTER_CONFIG[semester];
    if (!validMonths) {
        return res.status(400).json({ message: 'Invalid semester provided.' });
    }

    try {
        // 3. Fetch Assessment Types
        const allAssessmentsForSubject = await AssessmentType.find({ 
            subject: subjectId, 
            class: classId, 
            year: academicYear,
            month: { $in: validMonths }
        });

        if (allAssessmentsForSubject.length === 0) {
            return res.status(404).json({ message: 'No assessment types found for this semester.' });
        }

        // 4. Group and Sort Months based on Semester Order
        const assessmentTypesByMonth = {};
        allAssessmentsForSubject.forEach(at => {
            if (!assessmentTypesByMonth[at.month]) assessmentTypesByMonth[at.month] = [];
            assessmentTypesByMonth[at.month].push(at);
        });

        const sortedMonths = validMonths.filter(m => assessmentTypesByMonth[m]);

        // 5. Fetch Students and Grades
        const studentQuery = { class: classId, status: 'Active' };
        if (streamId && streamId !== 'all') studentQuery.stream = streamId;
        
        const students = await Student.find(studentQuery)
            .select('_id studentId fullName gender dateOfBirth')
            .sort({ fullName: 1 });

        if (students.length === 0) return res.status(404).json({ message: 'No active students found.' });

        const studentIds = students.map(s => s._id);
        const grades = await Grade.find({ 
            student: { $in: studentIds }, 
            subject: subjectId, 
            semester, 
            academicYear 
        }).populate('assessments.assessmentType');

        // 6. Optimization: Map grades by Student ID for O(1) access
        const gradeMap = new Map();
        grades.forEach(g => gradeMap.set(g.student.toString(), g));

        // 8. Construct Roster Data
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
                _id:student._id,
                studentId: student.studentId,
                fullName: student.fullName,
                gender: student.gender,
                age: typeof calculateAge === 'function' ? calculateAge(student.dateOfBirth) : 'N/A',
                detailedScores: studentDetailedScores,
                finalScore: gradeDoc ? parseFloat(gradeDoc.finalScore.toFixed(2)) : '-',
            };
        });

        // 9. Send Response
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
