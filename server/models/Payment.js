const mongoose = require('mongoose');

const PAYMENT_REASONS = ['Tuition Fee', 'Registration Fee','Book Fee','Transportation', 'Uniform', 'Other'];
const PAID_FOR_PERIODS = ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', '1st Quarter', '2nd Quarter','1st Semester','2nd Semester', '3rd Quarter', 'Annual'];

const paymentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student is required']
    },
    paymentReason: {
        type: String,
        required: [true, 'Payment reason is required'],
        trim: true,
        enum: {
            values: PAYMENT_REASONS,
            message: '{VALUE} is not a valid payment reason. Must be one of: ' + PAYMENT_REASONS.join(', ')
        }
    },
    paidFor: {
        type: String,
        required: [true, 'Paid for period is required'],
        trim: true,
        enum: {
            values: PAID_FOR_PERIODS,
            message: '{VALUE} is not a valid paid-for period. Must be one of: ' + PAID_FOR_PERIODS.join(', ')
        }
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    receiptCode: {
        type: String,
        required: [true, 'Receipt reference number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    academicYear: {
        type: String,
        required: [true, 'Academic year is required']
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);