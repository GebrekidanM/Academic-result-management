const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
    }
});

const upload = multer({ storage, fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
}, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

const pdfController = require('../controllers/pdfController');

const router = express.Router();

router.post('/extract-marks', upload.single('pdf'), protect, authorize('admin', 'staff'), pdfController.extractMarksFromPDF);

router.get('/marks-history', protect, authorize('admin', 'staff'), pdfController.getPDFMarksHistory);

module.exports = router;
