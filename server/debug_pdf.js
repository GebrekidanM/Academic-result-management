const pdf = require('pdf-parse');
const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./models/Student');
const Class = require('./models/Class');
const Stream = require('./models/Stream');

async function debugPdf() {
    // 1. Extract text from PDF
    let extractedText = '';
    try {
        const fs = require('fs');
        const buffer = fs.readFileSync('C:\\Users\\NILE\\Downloads\\4.pdf');
        const { PDFParse } = pdf;
        const parser = new PDFParse(new Uint8Array(buffer));
        const result = await parser.getText();
        extractedText = result.text;
    } catch (err) {
        console.error('PDF Error:', err.message);
        return;
    }

    console.log('=== RAW PDF TEXT (first 2000 chars) ===');
    console.log(extractedText.substring(0, 2000));
    console.log('\n=== ALL LINES ===');
    const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    lines.slice(0, 50).forEach((l, i) => console.log(`Line ${i}: ${l}`));

    // 2. Check DB students
    await mongoose.connect(process.env.MONGO_URI);
    const p7 = await Class.findOne({ className: 'P7' });
    const streamS = await Stream.findOne({ classId: p7._id, streamName: 'S' });
    const students = await Student.find({ class: p7._id, stream: streamS._id }).select('fullName');
    console.log(`\n=== DB STUDENTS in P7/S (${students.length}) ===`);
    students.forEach(s => console.log(' -', s.fullName));

    process.exit();
}

debugPdf().catch(err => { console.error(err); process.exit(1); });
