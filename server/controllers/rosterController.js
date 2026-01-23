// backend/controllers/rosterController.js
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Grade = require('../models/Grade');
const User = require('../models/User')
const AssessmentType = require('../models/AssessmentType');
const calculateAge = require('../utils/calculateAge')


// --- MAIN CONTROLLER ---
exports.generateRoster = async (req, res) => {
    const { gradeLevel, academicYear } = req.query;

    if (!gradeLevel || !academicYear) {
        return res.status(400).json({ message: 'Grade Level and Academic Year are required.' });
    }

    try {
        const homeroomTeacher = await User.findOne({ homeroomGrade: gradeLevel }).select('fullName');
        
        // Fetch Subjects
        const subjects = await Subject.find({ gradeLevel }).sort({ name: 1 });
        if (subjects.length === 0) return res.status(404).json({ message: 'No subjects found.' });

        // Fetch Students
        const students = await Student.find({ gradeLevel, status: 'Active' })
            .select('studentId fullName gender dateOfBirth _id')
            .sort({ fullName: 1 });
        
        if (students.length === 0) return res.status(404).json({ message: 'No active students found.' });
        
        // Fetch Grades
        const studentIds = students.map(s => s._id);
        const grades = await Grade.find({ student: { $in: studentIds }, academicYear }).populate('subject', 'name');

        // --- PROCESS DATA ---
        let rosterData = students.map(student => {
            const firstSemester = { scores: {}, total: 0, count: 0 };
            const secondSemester = { scores: {}, total: 0, count: 0 };
            const subjectAverages = {};

            subjects.forEach(subject => {
                // Find grade for specific subject & semester
                // Note: The ?. check handles if subject was deleted from DB but Grade remains
                const grade1st = grades.find(g => g.student.equals(student._id) && g.subject?._id.equals(subject._id) && g.semester === 'First Semester');
                const grade2nd = grades.find(g => g.student.equals(student._id) && g.subject?._id.equals(subject._id) && g.semester === 'Second Semester');
                
                const score1 = grade1st ? grade1st.finalScore : null;
                const score2 = grade2nd ? grade2nd.finalScore : null;

                // Semester 1 Accumulation
                firstSemester.scores[subject.name] = score1 ?? '-';
                if(score1 !== null) { 
                    firstSemester.total += score1; 
                    firstSemester.count++; 
                }

                // Semester 2 Accumulation
                secondSemester.scores[subject.name] = score2 ?? '-';
                if(score2 !== null) { 
                    secondSemester.total += score2; 
                    secondSemester.count++; 
                }
                
                // Subject Average (Across Semesters)
                const validScores = [score1, score2].filter(s => s !== null);
                subjectAverages[subject.name] = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : null;
            });
            
            // Calculate Semester Averages
            firstSemester.average = firstSemester.count > 0 ? firstSemester.total / firstSemester.count : 0;
            secondSemester.average = secondSemester.count > 0 ? secondSemester.total / secondSemester.count : 0;

            // --- FIX: Correct Overall Calculation ---
            // Overall Average should be the average of the two semester averages
            // Formula: (Avg1 + Avg2) / 2
            let overallAvgCalc = 0;
            let divisor = 0;
            
            if (firstSemester.count > 0) { overallAvgCalc += firstSemester.average; divisor++; }
            if (secondSemester.count > 0) { overallAvgCalc += secondSemester.average; divisor++; }

            const overallAverage = divisor > 0 ? overallAvgCalc / divisor : 0;
            const overallTotalSum = firstSemester.total + secondSemester.total;

            return {
                _id: student._id,
                studentId: student.studentId, 
                fullName: student.fullName,
                gender: student.gender,
                
                // USE THE HELPER FUNCTION HERE
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

                subjectAverages: Object.fromEntries(
                    Object.entries(subjectAverages).map(([key, val]) => [
                        key,
                        val !== null ? parseFloat(val.toFixed(2)) : '-'
                    ])
                ),

                overallTotal: parseFloat(overallTotalSum.toFixed(2)), 
                overallAverage: parseFloat(overallAverage.toFixed(2)),
                rank1st: '-', rank2nd: '-', overallRank: '-',
            };
        });
        
        // --- RANKING LOGIC (Highest Average = Rank 1) ---
        
        // Rank Semester 1
        rosterData.sort((a, b) => b.firstSemester.average - a.firstSemester.average);
        let currentRank = 1;
        for (let i = 0; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].firstSemester.average < rosterData[i - 1].firstSemester.average) { 
                currentRank = i + 1; 
            }
            // Only assign rank if they have grades
            rosterData[i].rank1st = rosterData[i].firstSemester.count > 0 ? currentRank : '-';
        }

        // Rank Semester 2
        rosterData.sort((a, b) => b.secondSemester.average - a.secondSemester.average);
        currentRank = 1;
        for (let i = 0; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].secondSemester.average < rosterData[i - 1].secondSemester.average) { 
                currentRank = i + 1; 
            }
            rosterData[i].rank2nd = rosterData[i].secondSemester.count > 0 ? currentRank : '-';
        }

        // Rank Overall
        rosterData.sort((a, b) => b.overallAverage - a.overallAverage);
        currentRank = 1;
        for (let i = 0; i < rosterData.length; i++) {
            if (i > 0 && rosterData[i].overallAverage < rosterData[i - 1].overallAverage) { 
                currentRank = i + 1; 
            }
            const hasAnyGrades = (rosterData[i].firstSemester.count + rosterData[i].secondSemester.count) > 0;
            rosterData[i].overallRank = hasAnyGrades ? currentRank : '-';
        }
        
        // Final Sort: Alphabetical for display
        rosterData.sort((a, b) => a.fullName.localeCompare(b.fullName));

        res.status(200).json(
            { 
                subjects: subjects.map(s => s.name), 
                roster: rosterData,
                homeroomTeacherName: homeroomTeacher ? homeroomTeacher.fullName : 'Not Assigned'
            }
        );
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