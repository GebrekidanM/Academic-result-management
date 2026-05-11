const Subject = require('../models/Subject');
const Class = require('../models/Class');
const xlsx = require('xlsx');
const fs = require('fs'); 
const Grade = require('../models/Grade');
const AssessmentType = require('../models/AssessmentType')
// @desc    Create a new subject
// @route   POST /api/subjects
exports.createSubject = async (req, res) => {
    try {
        const { name, code, classId, load } = req.body;
        const subject = await Subject.create({ name, code, class: classId, sessionsPerWeek: load });
        res.status(201).json({ success: true, data: subject });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all subjects
// @route   GET /api/subjects
exports.getSubjects = async (req, res) => {
    try {
        const filter = req.query.classId ? { class: req.query.classId } : {};
        const subjects = await Subject.find(filter).populate('class', 'className').sort({ name: 1 });
        res.status(200).json({ success: true, count: subjects.length, data: subjects });
    } catch (error) {
        console.error('Subjects fetch error:', error);
        res.status(500).json({ success: false, message: 'Database connection error', details: error.message });
    }
};

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
exports.getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id).populate('class', 'className');
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

/// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        // --- START OF CLEANUP ---
        
        // 1. Delete all Assessment Types for this subject
        await AssessmentType.deleteMany({ subject: req.params.id });

        // 2. Delete all Grades for this subject
        await Grade.deleteMany({ subject: req.params.id });

        // 3. Finally, delete the subject itself
        await subject.deleteOne();
        
        // --- END OF CLEANUP ---

        res.status(200).json({ 
            success: true, 
            message: 'Subject, associated Assessment Types, and Grades deleted successfully' 
        });

    } catch (error) {
        console.log(error)
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
        const subjectsToCreate = [];
        for (const row of subjectsJson) {
            const className = row['Class']; // Changed from Grade Level
            const cls = await Class.findOne({ className });
            if (!cls) continue; // Or handle error
            
            subjectsToCreate.push({
                name: row['Name'] || row['name'],
                class: cls._id,
                code: row['Code'] || row['code'] || '',
                sessionsPerWeek: row['Credit']
            });
        }

        // Insert all new subjects into the database
        const createdSubjects = await Subject.insertMany(subjectsToCreate, { ordered: false });

        fs.unlinkSync(filePath);

        res.status(201).json({
            message: `${createdSubjects.length} subjects imported successfully.`,
            data: createdSubjects
        });

    } catch (error) {
        fs.unlinkSync(filePath);
        if (error.code === 11000 || error.name === 'MongoBulkWriteError') {
            return res.status(400).json({ message: 'Import failed. Some subjects in the file may already exist for the same class.' });
        }
        console.error('Error importing subjects:', error);
        res.status(500).json({ message: 'An error occurred during the import process.' });
    }
};