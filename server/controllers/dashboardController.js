// backend/controllers/dashboardController.js
const Student = require('../models/Student');
const User = require('../models/User');
const Subject = require('../models/Subject');
const AuditLog = require('../models/AuditLog');
const Attendance = require('../models/Attendance');

exports.getStats = async (req, res) => {
    try {
        // 1. መሰረታዊ የቁጥር ስታቶች
        const [students, teachers, subjects] = await Promise.all([
            Student.countDocuments({ status: 'Active' }),
            User.countDocuments({ role: 'teacher' }),
            Subject.countDocuments({})
        ]);

        // 2. የቅርብ ጊዜ የስራ እንቅስቃሴ መዝገቦች (Audit Logs) [2]
        const recentLogs = await AuditLog.find({})
            .populate('user', 'fullName role')
            .sort({ createdAt: -1 })
            .limit(6);

        // 3. የዛሬውን የተማሪዎች መገኘት መጠን (Today's Attendance Rate) ማስላት
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

        // ⚠️ 4. እውነተኛ የተማሪዎችን ፆታ በየደረጃው (KG, Primary, High School) ለይቶ ማስላት [2]
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

        // ⚠️ 5. እውነተኛ የየወሩን የመገኘት ታሪክ ማጠቃለያ (Gzip/Attendance Monthly Aggregation) [1, 2]
        const monthlyStats = await Attendance.aggregate([
            {
                $project: {
                    month: { $month: "$date" }, // የሰነዱን ወር በቁጥር (1-12) መለየት
                    total: { $size: "$records" },
                    present: {
                        $size: {
                            $filter: {
                                input: "$records",
                                as: "r",
                                cond: { $in: ["$$r.status", ["Present", "Late"]] } // መገኘት እና ማርፈድ እንደ መገኘት ይቆጠራሉ
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

        // የኢትዮጵያ/ጎርጎርዮሳውያን ወራትን በቅደም ተከተል መደርደር (September -> June)
        const monthIndexMap = { 9: 0, 10: 1, 11: 2, 12: 3, 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9 };
        const trendData = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100]; // ሪከርድ ለሌላቸው ወራት ነባሪው 100%

        monthlyStats.forEach(stat => {
            const idx = monthIndexMap[stat._id];
            if (idx !== undefined && stat.totalStudents > 0) {
                trendData[idx] = parseFloat(((stat.presentStudents / stat.totalStudents) * 100).toFixed(1));
            }
        });

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
            attendanceTrend: trendData // ⚠️ እውነተኛው የየወሩ መገኘት ታሪክ እዚህ ይላካል [2]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};