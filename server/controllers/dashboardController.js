// server/controllers/statsController.js
const Student = require('../models/Student');
const User = require('../models/User');
const Subject = require('../models/Subject');
const AuditLog = require('../models/AuditLog');
const Attendance = require('../models/Attendance');

// Self-healing school section classifier to handle any database typos/variations safely
const getSchoolSection = (gradeLevel) => {
    const grade = (gradeLevel || '').trim().toLowerCase();
    
    if (/^(kg|nursery|pre)/i.test(grade)) {
        return 'kg';
    }
    
    const match = grade.match(/\d+/);
    if (match) {
        const num = parseInt(match[0], 10);
        if (num >= 1 && num <= 8) {
            return 'primary';
        }
        if (num >= 9 && num <= 12) {
            return 'highSchool';
        }
    }
    
    if (/grade|gtade/i.test(grade)) {
        if (/(9|1[0-2])/.test(grade)) {
            return 'highSchool';
        }
        return 'primary';
    }
    
    return 'primary'; 
};

exports.getStats = async (req, res) => {
    try {
        const [students, teachers, uniqueSubjects] = await Promise.all([
            Student.countDocuments({ status: 'Active' }),
            User.countDocuments({ role: 'teacher' }),
            Subject.distinct('name')
        ]);

        const subjects = uniqueSubjects.length;

        const recentLogs = await AuditLog.find({})
            .populate('user', 'fullName role')
            .sort({ createdAt: -1 })
            .limit(6);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayAttendance = await Attendance.find({
            date: { $gte: todayStart, $lte: todayEnd }
        });

        let attendanceRate = 100;
        if (todayAttendance.length > 0) {
            let totalStudents = 0;
            let presentStudents = 0;

            todayAttendance.forEach(sheet => {
                totalStudents += sheet.records.length;
                presentStudents += sheet.records.filter(r => r.status === 'Present' || r.status === 'Late').length;
            });

            if (totalStudents > 0) {
                attendanceRate = parseFloat(((presentStudents / totalStudents) * 100).toFixed(1));
            }
        }

        const activeStudents = await Student.find({ status: 'Active' }).select('gender gradeLevel').lean();

        let kgMale = 0, kgFemale = 0;
        let primaryMale = 0, primaryFemale = 0;
        let hsMale = 0, hsFemale = 0;

        activeStudents.forEach(s => {
            const section = getSchoolSection(s.gradeLevel);
            const gender = (s.gender || '').trim().toLowerCase(); // Safe-guard: Case-insensitive gender checks

            if (section === 'kg') {
                if (gender === 'male') kgMale++;
                else if (gender === 'female') kgFemale++;
            } else if (section === 'primary') {
                if (gender === 'male') primaryMale++;
                else if (gender === 'female') primaryFemale++;
            } else if (section === 'highSchool') {
                if (gender === 'male') hsMale++;
                else if (gender === 'female') hsFemale++;
            }
        });

        const monthlyStats = await Attendance.aggregate([
            {
                $project: {
                    month: { $month: "$date" },
                    total: { $size: "$records" },
                    present: {
                        $size: {
                            $filter: {
                                input: "$records",
                                as: "r",
                                cond: { $in: ["$$r.status", ["Present", "Late"]] }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$month",
                    totalStudents: { $sum: "$total" },
                    presentStudents: { $sum: "$present" }
                }
            }
        ]);

        const monthIndexMap = { 9: 0, 10: 1, 11: 2, 12: 3, 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9 };
        const trendData = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100];

        monthlyStats.forEach(stat => {
            const idx = monthIndexMap[stat._id];
            if (idx !== undefined && stat.totalStudents > 0) {
                trendData[idx] = parseFloat(((stat.presentStudents / stat.totalStudents) * 100).toFixed(1));
            }
        });


        // PROGRAMMATIC ENROLLMENT HISTORY COMPILATION
        const studentsDataForHistory = await Student.find({}, 'gender year academicHistory').lean();
        const yearlyGenderMap = {};

        studentsDataForHistory.forEach(student => {
            const g = (student.gender || '').trim().toLowerCase();
            if (!g || !['male', 'female'].includes(g)) return;

            const currentYear = student.year;
            if (currentYear) {
                if (!yearlyGenderMap[currentYear]) {
                    yearlyGenderMap[currentYear] = { male: 0, female: 0 };
                }
                if (g === 'male') yearlyGenderMap[currentYear].male++;
                else if (g === 'female') yearlyGenderMap[currentYear].female++;
            }

            if (Array.isArray(student.academicHistory)) {
                student.academicHistory.forEach(history => {
                    const histYear = history.year;
                    if (histYear) {
                        if (!yearlyGenderMap[histYear]) {
                            yearlyGenderMap[histYear] = { male: 0, female: 0 };
                        }
                        if (g === 'male') yearlyGenderMap[histYear].male++;
                        else if (g === 'female') yearlyGenderMap[histYear].female++;
                    }
                });
            }
        });

        const genderHistory = Object.keys(yearlyGenderMap)
            .sort()
            .map(yr => ({
                year: `${yr} E.C.`,
                male: yearlyGenderMap[yr].male,
                female: yearlyGenderMap[yr].female
            }));


        res.status(200).json({
            success: true,
            students,
            teachers,
            subjects,
            attendanceRate,
            recentLogs,
            genderDistribution: {
                kg: { male: kgMale, female: kgFemale },
                primary: { male: primaryMale, female: primaryFemale },
                highSchool: { male: hsMale, female: hsFemale }
            },
            genderHistory,
            attendanceTrend: trendData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};