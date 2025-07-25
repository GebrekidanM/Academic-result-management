const Subject = require('../models/Subject');
const xlsx = require('xlsx');
const fs = require('fs'); 

// @desc    Create a new subject
// @route   POST /api/subjects
exports.createSubject = async (req, res) => {
    try {
        const { name, code, gradeLevel } = req.body;
        const subject = await Subject.create({ name, code, gradeLevel });
        res.status(201).json({ success: true, data: subject });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all subjects
// @route   GET /api/subjects
exports.getSubjects = async (req, res) => {
    try {
        const filter = req.query.gradeLevel ? { gradeLevel: req.query.gradeLevel } : {};
        const subjects = await Subject.find(filter).sort({ name: 1 });
        res.status(200).json({ success: true, count: subjects.length, data: subjects });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
exports.getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        res.status(200).json({ success: true, data: subject });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
exports.updateSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        res.status(200).json({ success: true, data: subject });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        await subject.deleteOne();
        res.status(200).json({ success: true, message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create multiple subjects from an uploaded Excel file
// @route   POST /api/subjects/upload
exports.bulkCreateSubjects = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    const filePath = req.file.path;

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const subjectsJson = xlsx.utils.sheet_to_json(worksheet);

        if (subjectsJson.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'The Excel file is empty or formatted incorrectly.' });
        }

        // Prepare the data for insertion, matching Excel columns to our schema
        const subjectsToCreate = subjectsJson.map(subject => ({
            name: subject['Name'] || subject['name'],
            gradeLevel: subject['Grade Level'] || subject['gradeLevel'],
            code: subject['Code'] || subject['code'] || '' // Code is optional
        }));

        // Insert all new subjects into the database
        const createdSubjects = await Subject.insertMany(subjectsToCreate, { ordered: false });

        fs.unlinkSync(filePath); // Clean up the temporary file

        res.status(201).json({
            message: `${createdSubjects.length} subjects imported successfully.`,
            data: createdSubjects
        });

    } catch (error) {
        fs.unlinkSync(filePath); // Clean up even if there's an error
        // Handle duplicate errors (based on the index on 'name' and 'gradeLevel')
        if (error.code === 11000 || error.name === 'MongoBulkWriteError') {
            return res.status(400).json({ message: 'Import failed. Some subjects in the file may already exist for the same grade level.' });
        }
        console.error('Error importing subjects:', error);
        res.status(500).json({ message: 'An error occurred during the import process.' });
    }
};