// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createPayment, getStudentPaymentHistory, getAllPayments, getPaymentAnalytics } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('admin', 'staff', 'accountant'), createPayment)
    .get(protect, authorize('admin', 'staff', 'accountant'), getAllPayments);

router.route('/student/:studentId').get(protect, getStudentPaymentHistory);

router.route('/analytics')
    .get(protect, authorize('admin', 'staff', 'accountant'), getPaymentAnalytics);
module.exports = router;