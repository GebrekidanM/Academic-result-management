const Student = require('../models/Student');
const Class = require('../models/Class');
const Stream = require('../models/Stream');
const xlsx = require('xlsx');
const fs = require('fs');

// Helper to capitalize names
const capitalizeName = (name) => {
    if (!name) return '';
    return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

// Helper to get first name
const getFirstName = (fullName) => {
    return fullName.split(' ')[0] || 'User';
};

// Helper to parse dates
const parseExcelDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (!isNaN(value)) {
        const date = new Date((value - 25569) * 86400 * 1000);
        return date;
    }
    return new Date(value);
};

exports.bulkCreateStudents = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const filePath = req.file.path;
    try {
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet);

        if (!rows.length) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'The Excel file is empty.' });
        }

        const currentYear = new Date().getFullYear();
        const results = [];
        let created = 0, skipped = 0, errors = 0;

        for (const [index, row] of rows.entries()) {
            try {
                // 1. Resolve Full Name
                let fullName = row['Full Name'] || row['Name'];
                if (!fullName && (row['First Name'] || row['Last Name'])) {
                    fullName = [row['First Name'], row['Middle Name'], row['Last Name']].filter(Boolean).join(' ');
                }
                if (!fullName) {
                    results.push({ row: index + 2, status: 'error', reason: 'Missing name' });
                    errors++;
                    continue;
                }
                fullName = capitalizeName(fullName);

                // 2. Resolve Gender
                const gender = row['Gender'] || row['Sex'] || 'Other';

                // 3. Resolve Class
                const className = row['Class'] || row['Grade Level'] || row['Grade'];
                if (!className) {
                    results.push({ row: index + 2, status: 'error', reason: 'Missing class/grade' });
                    errors++;
                    continue;
                }

                const cls = await Class.findOne({ 
                    $or: [
                        { className: new RegExp(`^${className}$`, 'i') },
                        { className: new RegExp(className, 'i') }
                    ]
                });

                if (!cls) {
                    results.push({ row: index + 2, status: 'error', reason: `Class "${className}" not found` });
                    errors++;
                    continue;
                }

                // 4. Resolve Stream
                const streamName = row['Stream'] || row['Section'];
                let stmId = null;
                if (streamName) {
                    const stm = await Stream.findOne({ 
                        classId: cls._id,
                        streamName: new RegExp(`^${streamName}$`, 'i')
                    });
                    if (stm) stmId = stm._id;
                }

                // 5. Duplicate Check
                const exists = await Student.findOne({ fullName, class: cls._id });
                if (exists) {
                    results.push({ row: index + 2, status: 'skipped', reason: 'Student already exists' });
                    skipped++;
                    continue;
                }

                // 6. Create Student
                const initialPassword = `${getFirstName(fullName)}@${currentYear}`;
                const newStudent = new Student({
                    fullName,
                    gender,
                    dateOfBirth: parseExcelDate(row['Date of Birth'] || row['DOB']),
                    class: cls._id,
                    stream: stmId,
                    motherName: row['Mother Name'] || '',
                    motherContact: row['Mother Contact'] || row['Parent Phone'] || '',
                    fatherContact: row['Father Contact'] || '',
                    password: initialPassword,
                    healthStatus: row['Health Status'] || 'Normal'
                });

                await newStudent.save();
                results.push({ row: index + 2, status: 'created', studentId: newStudent.studentId });
                created++;

            } catch (err) {
                results.push({ row: index + 2, status: 'error', reason: err.message });
                errors++;
            }
        }

        fs.unlinkSync(filePath);
        res.status(201).json({
            success: true,
            message: `Import complete: ${created} created, ${skipped} skipped, ${errors} errors.`,
            summary: { created, skipped, errors },
            results
        });

    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ message: 'Error processing file', error: err.message });
    }
};
