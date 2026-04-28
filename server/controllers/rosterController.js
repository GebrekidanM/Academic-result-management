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

exports.generateRoster = async (req, res) => {
    const { gradeLevel, academicYear } = req.query;

    if (!gradeLevel || !academicYear) {
        return res.status(400).json({ message: 'Grade Level and Academic Year are required.' });
    }

    try {
        const homeroomTeacher = await User.findOne({ homeroomGrade: gradeLevel }).select('fullName');
        
        const academicSubjects = await Subject.find({ gradeLevel }).sort({ name: 1 }).lean();
        const supportiveSubjects = await SupportiveSubject.find({ gradeLevel }).sort({ name: 1 }).lean();

        if (academicSubjects.length === 0 && supportiveSubjects.length === 0) {
            return res.status(404).json({ message: 'No subjects found.' });
        }

        const students = await Student.find({ gradeLevel, status: 'Active' })
            .select('studentId fullName gender dateOfBirth _id')
            .sort({ fullName: 1 });
        
        if (students.length === 0) return res.status(404).json({ message: 'No active students found.' });
        
        const studentIds = students.map(s => s._id);

        const [academicGrades, supportiveGrades] = await Promise.all([
            Grade.find({ student: { $in: studentIds }, academicYear }).populate('subject', 'name'),
            SupportiveGrade.find({ student: { $in: studentIds }, academicYear }).populate('subject', 'name')
        ]);

        let rosterData = students.map(student => {
            const firstSemester = { scores: {}, total: 0, count: 0 };
            const secondSemester = { scores: {}, total: 0, count: 0 };
            const subjectAverages = {};

            // A. Process ACADEMIC (Fix: Keep numbers as numbers)
            academicSubjects.forEach(subject => {
                const grade1st = academicGrades.find(g => g.student.equals(student._id) && g.subject?._id.equals(subject._id) && g.semester === 'First Semester');
                const grade2nd = academicGrades.find(g => g.student.equals(student._id) && g.subject?._id.equals(subject._id) && g.semester === 'Second Semester');
                
                // Get Raw Numbers (or null)
                const val1 = grade1st ? grade1st.finalScore : null;
                const val2 = grade2nd ? grade2nd.finalScore : null;

                // --- CALCULATION LOGIC ---
                if (val1 !== null) {
                    firstSemester.total += val1; // Math addition (not string)
                    firstSemester.count++;
                    firstSemester.scores[subject.name] = parseFloat(val1.toFixed(2)); // Store pretty value
                } else {
                    firstSemester.scores[subject.name] = '-';
                }

                if (val2 !== null) {
                    secondSemester.total += val2;
                    secondSemester.count++;
                    secondSemester.scores[subject.name] = parseFloat(val2.toFixed(2));
                } else {
                    secondSemester.scores[subject.name] = '-';
                }
                
                // Calculate Subject Average
                const validScores = [val1, val2].filter(s => s !== null);
                const avg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
                subjectAverages[subject.name] = avg !== null ? parseFloat(avg.toFixed(2)) : '-';
            });

            // B. Process SUPPORTIVE
            supportiveSubjects.forEach(subject => {
                const grade1st = supportiveGrades.find(g => g.student.equals(student._id) && g.subject?._id.equals(subject._id) && g.semester === 'First Semester');
                const grade2nd = supportiveGrades.find(g => g.student.equals(student._id) && g.subject?._id.equals(subject._id) && g.semester === 'Second Semester');

                firstSemester.scores[subject.name] = grade1st ? grade1st.score : '-';
                secondSemester.scores[subject.name] = grade2nd ? grade2nd.score : '-';
                subjectAverages[subject.name] = '-';
            });
            
            // C. Averages Calculation
            firstSemester.average = firstSemester.count > 0 ? firstSemester.total / firstSemester.count : 0;
            secondSemester.average = secondSemester.count > 0 ? secondSemester.total / secondSemester.count : 0;

            let overallAvgCalc = 0;
            let divisor = 0;
            if (firstSemester.count > 0) { overallAvgCalc += firstSemester.average; divisor++; }
            if (secondSemester.count > 0) { overallAvgCalc += secondSemester.average; divisor++; }
            const overallAverage = divisor > 0 ? overallAvgCalc / divisor : 0;
            
            // Sum of sums
            const overallTotalSum = firstSemester.total + secondSemester.total;
            const overallTotalSumAvg = divisor > 0 ? overallTotalSum / divisor : overallTotalSum

            return {
                _id: student._id,
                studentId: student.studentId, 
                fullName: student.fullName,
                gender: student.gender,
                age: calculateAge(student.dateOfBirth),
                
                firstSemester: {
                    scores: firstSemester.scores,
                    total: parseFloat(firstSemester.total.toFixed(2)),
                    count: firstSemester.count,
                    average: parseFloat(firstSemester.average.toFixed(2)),
                },

                secondSemester: {
                    scores: secondSemester.scores,
                    total: parseFloat(secondSemester.total.toFixed(2)),
                    count: secondSemester.count,
                    average: parseFloat(secondSemester.average.toFixed(2)),
                },

                subjectAverages: subjectAverages,

                overallTotal: parseFloat(overallTotalSumAvg.toFixed(2)), 
                overallAverage: parseFloat(overallAverage.toFixed(2)),
                rank1st: '-', rank2nd: '-', overallRank: '-',
            };
        });
        
        // --- RANKING LOGIC ---
        rosterData.sort((a, b) => b.firstSemester.average - a.firstSemester.average);
        let currentRank = 1;
        for (let i = 0; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].firstSemester.average < rosterData[i - 1].firstSemester.average) { currentRank = i + 1; }
            rosterData[i].rank1st = rosterData[i].firstSemester.count > 0 ? currentRank : '-';
        }

        rosterData.sort((a, b) => b.secondSemester.average - a.secondSemester.average);
        currentRank = 1;
        for (let i = 0; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].secondSemester.average < rosterData[i - 1].secondSemester.average) { currentRank = i + 1; }
            rosterData[i].rank2nd = rosterData[i].secondSemester.count > 0 ? currentRank : '-';
        }

        rosterData.sort((a, b) => b.overallAverage - a.overallAverage);
        currentRank = 1;
        for (let i = 0; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].overallAverage < rosterData[i - 1].overallAverage) { currentRank = i + 1; }
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
// in backend/controllers/rosterController.js

exports.generateSubjectRoster = async (req, res) => {
    const { gradeLevel, subjectId, semester, academicYear } = req.query;

    // 1. Validation
    if (!gradeLevel || !subjectId || !semester || !academicYear) {
        return res.status(400).json({ message: 'Grade Level, Subject, Semester, and Year are required.' });
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
        // 3. Fetch Assessment Types (Filtered by Semester months if stored that way, or sorted later)
        const allAssessmentsForSubject = await AssessmentType.find({ 
            subject: subjectId, 
            gradeLevel, 
            year: academicYear,
            month: { $in: validMonths } // Database-level filtering for efficiency
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
        const students = await Student.find({ gradeLevel, status: 'Active' })
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
