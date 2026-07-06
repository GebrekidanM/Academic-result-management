// backend/controllers/paymentController.js
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { logActivity } = require('../utils/logger'); // ⚠️ የሎገር ረዳት ፈንክሽን [2]

// @desc    Record a manual student payment
// @route   POST /api/payments
exports.createPayment = async (req, res) => {
    const { studentId, paymentReason, paidFor, amount, receiptCode, academicYear } = req.body;

    if (!studentId || !paymentReason || !paidFor || !amount || !receiptCode || !academicYear) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const studentObj = await Student.findById(studentId);
        if (!studentObj) return res.status(404).json({ message: 'Student not found.' });

        // አዲስ ክፍያ መመዝገብ
        const payment = new Payment({
            student: studentId,
            paymentReason,
            paidFor,
            amount: Number(amount),
            receiptCode,
            academicYear,
            recordedBy: req.user._id
        });

        await payment.save();

        // ⚠️ የስራ እንቅስቃሴውን በሎገር መዝግብ [2]
        await logActivity(
            req.user._id,
            "Payment Recorded",
            `Recorded payment of ${amount} Birr (Receipt: ${receiptCode}) for student ${studentObj.fullName} - Reason: ${paymentReason}`,
            req
        );

        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'This receipt reference number (code) has already been used.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all payment history for a specific student (For Parents & Admin)
// @route   GET /api/payments/student/:studentId
exports.getStudentPaymentHistory = async (req, res) => {
    try {
        const { studentId } = req.params;
        const payments = await Payment.find({ student: studentId })
            .populate('recordedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all school-wide payments (For Admin Auditing)
// @route   GET /api/payments
exports.getAllPayments = async (req, res) => {
    try {
        const { academicYear, paymentReason } = req.query;
        const filter = {};
        if (academicYear) filter.academicYear = academicYear;
        if (paymentReason) filter.paymentReason = paymentReason;

        const payments = await Payment.find(filter)
            .populate('student', 'fullName studentId gradeLevel')
            .populate('recordedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Get detailed payment analytics (collected Birr, paid count, unpaid students list)
// @route   GET /api/payments/analytics
exports.getPaymentAnalytics = async (req, res) => {
    const { gradeLevel, academicYear, paymentReason, paidFor } = req.query;

    if (!gradeLevel || !academicYear || !paymentReason || !paidFor) {
        return res.status(400).json({ message: "Missing required fields (gradeLevel, academicYear, paymentReason, paidFor)." });
    }

    try {
        const students = await Student.find({ gradeLevel, status: 'Active' })
            .select('_id studentId fullName gender fatherContact motherContact')
            .sort({ fullName: 1 })
            .lean();

        if (!students.length) {
            return res.status(404).json({ message: `No active students found in ${gradeLevel}.` });
        }

        const studentIds = students.map(s => s._id);

        const payments = await Payment.find({
            student: { $in: studentIds },
            paymentReason,
            paidFor,
            academicYear
        }).lean();

        const paidStudentMap = new Map();
        let totalCollected = 0;

        payments.forEach(p => {
            paidStudentMap.set(p.student.toString(), p);
            totalCollected += p.amount;
        });

        const paidStudentsList = [];
        const unpaidStudentsList = [];

        students.forEach(student => {
            const paymentRecord = paidStudentMap.get(student._id.toString());
            if (paymentRecord) {
                paidStudentsList.push({
                    _id: student._id,
                    studentId: student.studentId,
                    fullName: student.fullName,
                    gender: student.gender,
                    amountPaid: paymentRecord.amount,
                    receiptCode: paymentRecord.receiptCode,
                    paidAt: paymentRecord.createdAt
                });
            } else {
                unpaidStudentsList.push({
                    _id: student._id,
                    studentId: student.studentId,
                    fullName: student.fullName,
                    gender: student.gender,
                    fatherContact: student.fatherContact,
                    motherContact: student.motherContact
                });
            }
        });

        res.status(200).json({
            success: true,
            meta: { gradeLevel, academicYear, paymentReason, paidFor },
            summary: {
                totalStudents: students.length,
                paidCount: paidStudentsList.length,
                unpaidCount: unpaidStudentsList.length,
                totalCollectedETB: totalCollected
            },
            paidStudents: paidStudentsList,
            unpaidStudents: unpaidStudentsList
        });

    } catch (error) {
        console.error("Payment Analytics Error:", error);
        res.status(500).json({ message: "Server error generating payment analytics." });
    }
};