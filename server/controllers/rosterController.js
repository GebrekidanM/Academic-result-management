// backend/controllers/rosterController.js
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Grade = require('../models/Grade');
const AssessmentType = require('../models/AssessmentType');

exports.generateRoster = async (req, res) => {
    const { gradeLevel, academicYear } = req.query;

    if (!gradeLevel || !academicYear) {
        return res.status(400).json({ message: 'Grade Level and Academic Year are required.' });
    }

    try {
        const subjects = await Subject.find({ gradeLevel }).sort({ name: 1 });
        if (subjects.length === 0) return res.status(404).json({ message: 'No subjects found.' });

        const students = await Student.find({ gradeLevel, status: 'Active' }).sort({ fullName: 1 });
        if (students.length === 0) return res.status(404).json({ message: 'No active students found.' });
        
        const studentIds = students.map(s => s._id);
        const grades = await Grade.find({ student: { $in: studentIds }, academicYear }).populate('subject', 'name');

        let rosterData = students.map(student => {
            const firstSemester = { scores: {}, total: 0, count: 0 };
            const secondSemester = { scores: {}, total: 0, count: 0 };
            const subjectAverages = {};

            subjects.forEach(subject => {
                const grade1st = grades.find(g => g.student.equals(student._id) && g.subject._id.equals(subject._id) && g.semester === 'First Semester');
                const grade2nd = grades.find(g => g.student.equals(student._id) && g.subject._id.equals(subject._id) && g.semester === 'Second Semester');
                
                const score1 = grade1st ? grade1st.finalScore : null;
                const score2 = grade2nd ? grade2nd.finalScore : null;

                firstSemester.scores[subject.name] = score1 ?? '-';
                if(score1 !== null) { firstSemester.total += score1; firstSemester.count++; }

                secondSemester.scores[subject.name] = score2 ?? '-';
                if(score2 !== null) { secondSemester.total += score2; secondSemester.count++; }
                
                const validScores = [score1, score2].filter(s => s !== null);
                subjectAverages[subject.name] = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
            });
            
            firstSemester.average = firstSemester.count > 0 ? firstSemester.total / firstSemester.count : 0;
            secondSemester.average = secondSemester.count > 0 ? secondSemester.total / secondSemester.count : 0;

            const overallTotal = (firstSemester.total + secondSemester.total)/2;
            const overallCount = firstSemester.count + secondSemester.count;
            const overallAverage = overallCount > 0 ? overallTotal / overallCount : 0;

            return {
                studentId: student.studentId, fullName: student.fullName,
                firstSemester, secondSemester, subjectAverages,
                overallTotal, overallAverage,
                rank1st: 0, rank2nd: 0, overallRank: 0
            };
        });
        
        // --- RANKING LOGIC ---
        rosterData.sort((a, b) => b.firstSemester.average - a.firstSemester.average);
        for (let i = 0, rank = 1; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].firstSemester.average < rosterData[i - 1].firstSemester.average) { rank = i + 1; }
            rosterData[i].rank1st = rosterData[i].firstSemester.count > 0 ? rank : '-';
        }

        rosterData.sort((a, b) => b.secondSemester.average - a.secondSemester.average);
        for (let i = 0, rank = 1; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].secondSemester.average < rosterData[i - 1].secondSemester.average) { rank = i + 1; }
            rosterData[i].rank2nd = rosterData[i].secondSemester.count > 0 ? rank : '-';
        }

        rosterData.sort((a, b) => b.overallAverage - a.overallAverage);
        for (let i = 0, rank = 1; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].overallAverage < rosterData[i - 1].overallAverage) { rank = i + 1; }
            rosterData[i].overallRank = rosterData[i].firstSemester.count + rosterData[i].secondSemester.count > 0 ? rank : '-';
        }
        
        rosterData.sort((a, b) => a.fullName.localeCompare(b.fullName));

        res.status(200).json({ subjects: subjects.map(s => s.name), roster: rosterData });
    } catch (error) {
        console.error('Error generating roster:', error);
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
        const allAssessmentsForSubject = await AssessmentType.find({ subject: subjectId, gradeLevel }).sort({ name: 1 });
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

        const students = await Student.find({ gradeLevel, status: 'Active' }).sort({ fullName: 1 });
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
                studentId: student.studentId, fullName: student.fullName,
                detailedScores: studentDetailedScores,
                finalScore: gradeDoc ? gradeDoc.finalScore : '-'
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