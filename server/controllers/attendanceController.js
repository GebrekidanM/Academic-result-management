const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { logActivity } = require('../utils/logger');

// @desc    Save today's student attendance sheet
// @route   POST /api/attendance
exports.takeAttendance = async (req, res) => {
    const { gradeLevel, date, records } = req.body;

    if (!gradeLevel || !date || !records || !Array.isArray(records)) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0); // ቀኑን በ0 ሰዓት መገደብ (ለአንድ ቀን አንድ መዝገብ ብቻ እንዲሆን)

        // ቀደም ሲል ለዚህ ክፍል ዛሬ የተሞላ መገኘት ካለ መፈለግ
        let attendanceSheet = await Attendance.findOne({ gradeLevel, date: attendanceDate });

        if (attendanceSheet) {
            // ካለ ማዘመን (Update ማድረግ)
            attendanceSheet.records = records;
            attendanceSheet.takenBy = req.user._id;
            await attendanceSheet.save();
        } else {
            // ከሌለ አዲስ መፍጠር
            attendanceSheet = new Attendance({
                gradeLevel,
                date: attendanceDate,
                records,
                takenBy: req.user._id
            });
            await attendanceSheet.save();
        }

        // የስራ እንቅስቃሴውን በሎገር መዝግብ
        await logActivity(
            req.user._id,
            "Attendance Taken",
            `Recorded student attendance for ${gradeLevel} on ${attendanceDate.toLocaleDateString()}`,
            req
        );

        res.status(200).json({ success: true, message: 'Attendance recorded successfully', data: attendanceSheet });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error saving attendance' });
    }
};

// @desc    Get attendance sheet for a specific class and date
// @route   GET /api/attendance
exports.getAttendanceByClass = async (req, res) => {
    const { gradeLevel, date } = req.query;

    try {
        const searchDate = new Date(date);
        searchDate.setHours(0, 0, 0, 0);

        const sheet = await Attendance.findOne({ gradeLevel, date: searchDate })
            .populate('records.student', 'fullName studentId imageUrl gender motherContact fatherContact healthStatus');
        
        res.status(200).json({ success: true, data: sheet });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get attendance stats and history for a specific student (For Parents)
// @route   GET /api/attendance/student/:studentId
exports.getStudentAttendance = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required.' });
        }

        const targetId = studentId.toString();

        const records = await Attendance.find({ "records.student": studentId })
            .select('date records.status')
            .lean();

        let total = records.length;
        let present = 0, absent = 0, late = 0, excused = 0;
        const history = [];

        records.forEach(sheet => {
            // ⚠️ ማስተካከያ፦ r.student መኖሩን አስቀድሞ ማረጋገጥ (የሰርቨር ክራሽ ስህተቱን ሙሉ በሙሉ ይፈታል) [2]
            const record = sheet.records.find(r => r.student && r.student.toString() === targetId);
            
            if (record) {
                if (record.status === 'Present') present++;
                else if (record.status === 'Absent') {
                    absent++;
                    history.push({ date: sheet.date, status: 'Absent' });
                }
                else if (record.status === 'Late') {
                    late++;
                    history.push({ date: sheet.date, status: 'Late' });
                }
                else if (record.status === 'Excused') {
                    excused++;
                    history.push({ date: sheet.date, status: 'Excused' });
                }
            }
        });

        // የመገኘት መቶኛ (Present + Late እንደ መገኘት ይቆጠራል)
        const rate = total > 0 ? (((present + late) / total) * 100) : 100;

        res.status(200).json({
            success: true,
            stats: { 
                total, 
                present, 
                absent, 
                late, 
                excused, 
                rate: parseFloat(rate.toFixed(1)) 
            },
            history: history.sort((a, b) => new Date(b.date) - new Date(a.date)) // ከቅርብ ወደ ሩቅ ቀን መደርደር
        });
    } catch (error) {
        console.error("Error in getStudentAttendance:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Get attendance status and rates for all classes for a specific date (For Admin)
// @route   GET /api/attendance/status
exports.getAttendanceStatusByDate = async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required.' });

    try {
        const searchDate = new Date(date);
        searchDate.setHours(0, 0, 0, 0);

        const students = await Student.find({ status: 'Active' }).select('gradeLevel');
        const classes = [...new Set(students.map(s => s.gradeLevel))].sort();

        const sheets = await Attendance.find({ date: searchDate }).populate('takenBy', 'fullName');

        const statusReport = classes.map(grade => {
            const sheet = sheets.find(s => s.gradeLevel === grade);
            let status = 'Pending';
            let rate = 100;
            let takenBy = '-';
            let stats = { present: 0, absent: 0, late: 0, excused: 0 };

            if (sheet) {
                status = 'Completed'; 
                takenBy = sheet.takenBy ? sheet.takenBy.fullName : 'Admin';
                const total = sheet.records.length;
                const present = sheet.records.filter(r => r.status === 'Present').length;
                const late = sheet.records.filter(r => r.status === 'Late').length;
                const absent = sheet.records.filter(r => r.status === 'Absent').length;
                const excused = sheet.records.filter(r => r.status === 'Excused').length;

                stats = { present, absent, late, excused };
                rate = total > 0 ? (((present + late) / total) * 100) : 100;
            }

            return {
                gradeLevel: grade,
                status,
                rate: parseFloat(rate.toFixed(1)),
                takenBy,
                stats
            };
        });

        res.status(200).json({ success: true, date: searchDate, data: statusReport });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};