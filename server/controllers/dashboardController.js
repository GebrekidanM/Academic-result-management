// server/controllers/statsController.js
const Student = require('../models/Student');
const User = require('../models/User');
const Subject = require('../models/Subject');
const AuditLog = require('../models/AuditLog');
const Attendance = require('../models/Attendance');

exports.getStats = async (req, res) => {
    try {
        // Use Subject.distinct('name') to retrieve only unique subject names across the curriculum
        const [students, teachers, uniqueSubjects] = await Promise.all([
            Student.countDocuments({ status: 'Active' }),
            User.countDocuments({ role: 'teacher' }),
            Subject.distinct('name') // Returns an array of unique names (e.g. ['Math', 'Physics'])
        ]);

        const subjects = uniqueSubjects.length; // Count of unique subjects

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
            const grade = s.gradeLevel || '';
            const isKg = /^(kg|nursery|pre)/i.test(grade);
            const isPrimary = /^Grade\s*[1-8](\D|$)/i.test(grade);
            const isHigh = /^Grade\s*(9|1[0-2])(\D|$)/i.test(grade);

            if (isKg) {
                if (s.gender === 'Male') kgMale++;
                else if (s.gender === 'Female') kgFemale++;
            } else if (isPrimary) {
                if (s.gender === 'Male') primaryMale++;
                else if (s.gender === 'Female') primaryFemale++;
            } else if (isHigh) {
                if (s.gender === 'Male') hsMale++;
                else if (s.gender === 'Female') hsFemale++;
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


        // ====================================================
        // PROGRAMMATIC ENROLLMENT HISTORY COMPILATION
        // ====================================================
        const studentsDataForHistory = await Student.find({}, 'gender year academicHistory').lean();
        const yearlyGenderMap = {};

        studentsDataForHistory.forEach(student => {
            const g = student.gender;
            if (!g || !['Male', 'Female'].includes(g)) return;

            // 1. Process current academic year ("are")
            const currentYear = student.year;
            if (currentYear) {
                if (!yearlyGenderMap[currentYear]) {
                    yearlyGenderMap[currentYear] = { male: 0, female: 0 };
                }
                if (g === 'Male') yearlyGenderMap[currentYear].male++;
                else if (g === 'Female') yearlyGenderMap[currentYear].female++;
            }

            // 2. Process historical academic years ("were")
            if (Array.isArray(student.academicHistory)) {
                student.academicHistory.forEach(history => {
                    const histYear = history.year;
                    if (histYear) {
                        if (!yearlyGenderMap[histYear]) {
                            yearlyGenderMap[histYear] = { male: 0, female: 0 };
                        }
                        if (g === 'Male') yearlyGenderMap[histYear].male++;
                        else if (g === 'Female') yearlyGenderMap[histYear].female++;
                    }
                });
            }
        });

        // Convert the map to a sorted chronological array for the chart
        const genderHistory = Object.keys(yearlyGenderMap)
            .sort() // Chronological order (e.g. 2016, 2017, 2018)
            .map(yr => ({
                year: `${yr} E.C.`, // Display year labeled as Ethiopian Calendar
                male: yearlyGenderMap[yr].male,
                female: yearlyGenderMap[yr].female
            }));
        // ====================================================


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
            genderHistory, // Included here for chart rendering
            attendanceTrend: trendData
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};