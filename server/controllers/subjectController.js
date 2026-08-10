// server/controllers/subjectController.js
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const GradeLevel = require('../models/GradeLevel');
const Grade = require('../models/Grade');
const AssessmentType = require('../models/AssessmentType');
const xlsx = require('xlsx');
const fs = require('fs'); 

// @desc    Create or Link a subject (Smart Upsert)
// @route   POST /api/subjects
exports.createSubject = async (req, res) => {
    const { name, code, gradeLevels, gradeLevel, sessionsPerWeek } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Subject name is required.' });
    }

    try {
        let formattedGradeLevels = [];

        // Scenario A: Request provides gradeLevels array [{ gradeLevel, sessionsPerWeek }]
        if (Array.isArray(gradeLevels) && gradeLevels.length > 0) {
            for (const item of gradeLevels) {
                let gId = item.gradeLevel;
                if (typeof gId === 'string' && !mongoose.Types.ObjectId.isValid(gId)) {
                    const gDoc = await GradeLevel.findOne({ name: gId }).collation({ locale: 'en', strength: 2 });
                    if (gDoc) gId = gDoc._id;
                }
                if (gId) {
                    formattedGradeLevels.push({
                        gradeLevel: gId,
                        sessionsPerWeek: Number(item.sessionsPerWeek) || 3
                    });
                }
            }
        } 
        // Scenario B: Fallback for single gradeLevel ID or string name
        else if (gradeLevel) {
            let gId = gradeLevel;
            if (typeof gId === 'string' && !mongoose.Types.ObjectId.isValid(gId)) {
                const gDoc = await GradeLevel.findOne({ name: gradeLevel }).collation({ locale: 'en', strength: 2 });
                if (gDoc) gId = gDoc._id;
            }
            if (gId) {
                formattedGradeLevels.push({ 
                    gradeLevel: gId, 
                    sessionsPerWeek: Number(sessionsPerWeek) || 3 
                });
            }
        }

        // SMART UPSERT: Check if subject name already exists in database
        let subjectDoc = await Subject.findOne({ name: name.trim() })
            .collation({ locale: 'en', strength: 2 });

        if (subjectDoc) {
            // Merge new grade levels into existing subject
            for (const newGl of formattedGradeLevels) {
                const exists = subjectDoc.gradeLevels.some(g => g.gradeLevel.equals(newGl.gradeLevel));
                if (!exists) {
                    subjectDoc.gradeLevels.push(newGl);
                }
            }
            if (code && !subjectDoc.code) subjectDoc.code = code.trim();
            await subjectDoc.save();
        } else {
            // Create brand new subject
            subjectDoc = new Subject({
                name: name.trim(),
                code: code ? code.trim() : '',
                gradeLevels: formattedGradeLevels
            });
            await subjectDoc.save();
        }

        // Return populated subject for frontend display
        const populatedSubject = await Subject.findById(subjectDoc._id)
            .populate('gradeLevels.gradeLevel', 'name schoolLevel');

        res.status(201).json({ success: true, data: populatedSubject });

    } catch (error) {
        console.error("Error creating/linking subject:", error);
        res.status(500).json({ message: 'Server error creating subject', details: error.message });
    }
};

// @desc    Get all subjects (Optionally filtered by gradeLevel)
// @route   GET /api/subjects
exports.getSubjects = async (req, res) => {
    try {
        let filter = {};

        if (req.query.gradeLevel) {
            const gradeParam = req.query.gradeLevel;
            let targetGradeId = gradeParam;

            if (typeof gradeParam === 'string' && !mongoose.Types.ObjectId.isValid(gradeParam)) {
                const gDoc = await GradeLevel.findOne({ name: gradeParam }).collation({ locale: 'en', strength: 2 });
                if (gDoc) targetGradeId = gDoc._id;
            }

            filter = { 'gradeLevels.gradeLevel': targetGradeId };
        }

        const subjects = await Subject.find(filter)
            .populate('gradeLevels.gradeLevel', 'name schoolLevel')
            .sort({ name: 1 });

        res.status(200).json({ success: true, count: subjects.length, data: subjects });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
exports.getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id)
            .populate('gradeLevels.gradeLevel', 'name schoolLevel');

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
        const { name, code, gradeLevels } = req.body;
        const updateData = {};

        if (name) updateData.name = name.trim();
        if (code !== undefined) updateData.code = code.trim();

        if (Array.isArray(gradeLevels)) {
            const formattedList = [];
            for (const item of gradeLevels) {
                let gId = item.gradeLevel;
                if (typeof gId === 'string' && !mongoose.Types.ObjectId.isValid(gId)) {
                    const gDoc = await GradeLevel.findOne({ name: gId }).collation({ locale: 'en', strength: 2 });
                    if (gDoc) gId = gDoc._id;
                }
                if (gId) {
                    formattedList.push({
                        gradeLevel: gId,
                        sessionsPerWeek: Number(item.sessionsPerWeek) || 3
                    });
                }
            }
            updateData.gradeLevels = formattedList;
        }

        const subject = await Subject.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        }).populate('gradeLevels.gradeLevel', 'name schoolLevel');

        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        res.status(200).json({ success: true, data: subject });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A subject with this name already exists.' });
        }
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

        await AssessmentType.deleteMany({ subject: req.params.id });
        await Grade.deleteMany({ subject: req.params.id });
        await subject.deleteOne();

        res.status(200).json({ 
            success: true, 
            message: 'Subject, associated Assessment Types, and Grades deleted successfully' 
        });

    } catch (error) {
        console.error("Delete subject error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create/Update multiple subjects from an uploaded Excel file
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

        const allGradeLevels = await GradeLevel.find({});
        const gradeLevelMap = new Map();
        allGradeLevels.forEach(gl => {
            gradeLevelMap.set(gl.name.toLowerCase().trim(), gl._id);
        });

        const groupedSubjects = new Map();

        for (const row of subjectsJson) {
            const rawName = row['Name'] || row['name'];
            if (!rawName) continue;

            const name = rawName.trim();
            const key = name.toLowerCase();
            const code = row['Code'] || row['code'] || '';
            const rawGrade = row['Grade Level'] || row['gradeLevel'] || '';
            const sessions = Number(row['Credit']) || Number(row['sessionsPerWeek']) || 3;

            let gradeLevelId = null;
            if (rawGrade) {
                const normGrade = rawGrade.toString().toLowerCase().trim();
                if (gradeLevelMap.has(normGrade)) {
                    gradeLevelId = gradeLevelMap.get(normGrade);
                } else if (mongoose.Types.ObjectId.isValid(rawGrade)) {
                    gradeLevelId = new mongoose.Types.ObjectId(rawGrade);
                }
            }

            if (!groupedSubjects.has(key)) {
                groupedSubjects.set(key, {
                    name,
                    code,
                    gradeLevels: []
                });
            }

            const subjectGroup = groupedSubjects.get(key);
            if (gradeLevelId) {
                const exists = subjectGroup.gradeLevels.some(g => g.gradeLevel.equals(gradeLevelId));
                if (!exists) {
                    subjectGroup.gradeLevels.push({
                        gradeLevel: gradeLevelId,
                        sessionsPerWeek: sessions
                    });
                }
            }
        }

        let createdCount = 0;
        let updatedCount = 0;

        for (const [key, item] of groupedSubjects.entries()) {
            const existingSubject = await Subject.findOne({ name: item.name })
                .collation({ locale: 'en', strength: 2 });

            if (existingSubject) {
                item.gradeLevels.forEach(newGl => {
                    const exists = existingSubject.gradeLevels.some(g => g.gradeLevel.equals(newGl.gradeLevel));
                    if (!exists) {
                        existingSubject.gradeLevels.push(newGl);
                    }
                });
                if (item.code) existingSubject.code = item.code;
                await existingSubject.save();
                updatedCount++;
            } else {
                await Subject.create(item);
                createdCount++;
            }
        }

        fs.unlinkSync(filePath);

        res.status(201).json({
            message: `Import complete. Created ${createdCount} new subjects, updated ${updatedCount} existing subjects.`,
            summary: { created: createdCount, updated: updatedCount }
        });

    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error('Error importing subjects:', error);
        res.status(500).json({ message: 'An error occurred during the import process.', details: error.message });
    }
};

// @desc    Assign/Update multiple subjects for a specific Grade Level
// @route   POST /api/subjects/assign-to-grade
exports.assignSubjectsToGradeLevel = async (req, res) => {
    const { gradeLevelId, subjects } = req.body; 

    if (!gradeLevelId || !mongoose.Types.ObjectId.isValid(gradeLevelId)) {
        return res.status(400).json({ message: 'Valid Grade Level ID is required.' });
    }

    if (!Array.isArray(subjects)) {
        return res.status(400).json({ message: 'Subjects array is required.' });
    }

    try {
        const targetGradeObjectId = new mongoose.Types.ObjectId(gradeLevelId);
        const selectedSubjectIds = subjects.map(s => s.subjectId.toString());

        await Subject.updateMany(
            { _id: { $nin: selectedSubjectIds }, 'gradeLevels.gradeLevel': targetGradeObjectId },
            { $pull: { gradeLevels: { gradeLevel: targetGradeObjectId } } }
        );

        for (const item of subjects) {
            const subjectDoc = await Subject.findById(item.subjectId);
            if (!subjectDoc) continue;

            const sessions = Number(item.sessionsPerWeek) || 3;
            const existingIndex = subjectDoc.gradeLevels.findIndex(g => g.gradeLevel.equals(targetGradeObjectId));

            if (existingIndex !== -1) {
                subjectDoc.gradeLevels[existingIndex].sessionsPerWeek = sessions;
            } else {
                subjectDoc.gradeLevels.push({
                    gradeLevel: targetGradeObjectId,
                    sessionsPerWeek: sessions
                });
            }

            await subjectDoc.save();
        }

        res.status(200).json({ 
            success: true, 
            message: `Successfully updated subject assignments for this grade level.` 
        });

    } catch (error) {
        console.error("Error assigning subjects to grade level:", error);
        res.status(500).json({ message: 'Server error updating subject assignments', details: error.message });
    }
};