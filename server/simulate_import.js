const mongoose = require('mongoose');
const xlsx = require('xlsx');
require('dotenv').config();

const Student = require('./models/Student');
const Class = require('./models/Class');
const Stream = require('./models/Stream');

const capitalizeName = (name) => {
    if (!name) return '';
    return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const normalize = (s) => s.toString().replace(/[\s\.]/g, '').toUpperCase();

async function doImport() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB\n');

        const filePath = 'C:\\Users\\NILE\\Downloads\\P.7.S-students-20260506 - Copy.xlsx';
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet);

        console.log(`Total rows: ${rows.length}`);
        console.log('Sample row:', rows[0]);
        console.log('---');

        const allClasses = await Class.find({});
        const results = [];

        for (const [index, row] of rows.entries()) {
            try {
                // 1. Full Name
                let fullName = row['Full Name'] || row['Name'];
                if (!fullName && (row['First Name'] || row['Last Name'])) {
                    fullName = [row['First Name'], row['Middle Name'], row['Last Name']].filter(Boolean).join(' ');
                }
                if (!fullName) { results.push({ row: index+2, status: 'error', reason: 'No name' }); continue; }
                fullName = capitalizeName(fullName);

                // 2. Gender
                let gender = (row['Gender'] || row['Sex'] || 'Other').toString();
                if (gender.toLowerCase().startsWith('m')) gender = 'Male';
                else if (gender.toLowerCase().startsWith('f')) gender = 'Female';
                else gender = 'Male'; // default

                // 3. Class + Stream
                let rawClass = (row['Class'] || row['Grade Level'] || row['Grade'] || '').toString().trim();
                let rawStream = (row['Stream'] || row['Section'] || '').toString().trim();

                if (!rawStream && rawClass.includes(' ')) {
                    const parts = rawClass.split(/\s+/);
                    if (parts.length === 2 && parts[1].length === 1) { rawClass = parts[0]; rawStream = parts[1]; }
                } else if (!rawStream && rawClass.length > 2) {
                    const last = rawClass.slice(-1).toUpperCase();
                    if (/[A-Z]/.test(last) && !isNaN(rawClass.slice(-2, -1))) { rawClass = rawClass.slice(0, -1); rawStream = last; }
                }

                let cls = await Class.findOne({ className: { $regex: new RegExp(`^${rawClass}$`, 'i') } });
                if (!cls) cls = allClasses.find(c => normalize(c.className) === normalize(rawClass));

                if (!cls) { results.push({ row: index+2, status: 'error', reason: `Class "${rawClass}" not found` }); continue; }

                // 4. Stream
                let stmId = null;
                const allStreams = await Stream.find({ classId: cls._id });
                if (rawStream) {
                    const stm = allStreams.find(s => normalize(s.streamName) === normalize(rawStream));
                    if (stm) stmId = stm._id;
                }
                if (!stmId) {
                    if (allStreams.length === 1) { stmId = allStreams[0]._id; }
                    else { results.push({ row: index+2, status: 'error', reason: `Stream "${rawStream}" not found. Available: ${allStreams.map(s=>s.streamName).join(', ')}` }); continue; }
                }

                // 5. Duplicate check
                let student = await Student.findOne({ fullName, class: cls._id });
                if (student) {
                    student.stream = stmId;
                    await student.save();
                    results.push({ row: index+2, status: 'updated', fullName });
                    continue;
                }

                // 6. Create
                const initialPassword = `${fullName.split(' ')[0]}@${new Date().getFullYear()}`;
                const newStudent = new Student({
                    fullName,
                    gender,
                    dateOfBirth: null,
                    class: cls._id,
                    stream: stmId,
                    motherName: row['Mother Name'] || '',
                    motherContact: row['Mother Contact'] || '',
                    fatherContact: row['Father Contact'] || '',
                    password: initialPassword,
                    healthStatus: 'Normal'
                });
                await newStudent.save();
                results.push({ row: index+2, status: 'created', fullName, studentId: newStudent.studentId });

            } catch (err) {
                results.push({ row: index+2, status: 'error', reason: err.message });
            }
        }

        const created = results.filter(r => r.status === 'created');
        const updated = results.filter(r => r.status === 'updated');
        const errors = results.filter(r => r.status === 'error');

        console.log(`\n=== RESULTS ===`);
        console.log(`Created: ${created.length}`);
        console.log(`Updated: ${updated.length}`);
        console.log(`Errors: ${errors.length}`);
        if (errors.length) {
            console.log('\nErrors:');
            errors.forEach(e => console.log(`  Row ${e.row}: ${e.reason}`));
        }
        process.exit();
    } catch (err) {
        console.error('Fatal Error:', err.message);
        process.exit(1);
    }
}

doImport();
