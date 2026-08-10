// server/controllers/scheduleController.js
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const Subject = require('../models/Subject');
const GradeLevel = require('../models/GradeLevel');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

// Helper to resolve GradeLevel ObjectId cleanly from either ObjectId or Name String
const resolveGradeLevelId = async (gradeParam) => {
    if (!gradeParam) return null;
    if (mongoose.Types.ObjectId.isValid(gradeParam) && gradeParam.length === 24) {
        return new mongoose.Types.ObjectId(gradeParam);
    }
    const gDoc = await GradeLevel.findOne({ name: gradeParam }).collation({ locale: 'en', strength: 2 });
    return gDoc ? gDoc._id : null;
};

// @desc    Get Schedule for a specific Grade
// @route   GET /api/schedule/:gradeLevel
exports.getClassSchedule = async (req, res) => {
    try {
        const { academicYear, gradeLevel } = req.query;
        const targetGradeId = await resolveGradeLevelId(gradeLevel || req.params.gradeLevel);

        if (!targetGradeId) {
            return res.status(404).json({ message: 'Grade Level not found.' });
        }

        const schedule = await Schedule.find({ gradeLevel: targetGradeId, academicYear })
            .populate('subject', 'name code')
            .populate('teacher', 'fullName')
            .populate('gradeLevel', 'name schoolLevel')
            .lean();

        res.json({ success: true, data: schedule });
    } catch (error) {
        console.error("getClassSchedule error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Master Schedule (All Grades)
// @route   GET /api/schedule/master
exports.getMasterSchedule = async (req, res) => {
    try {
        const { academicYear } = req.query;
        if (!academicYear) {
            return res.status(400).json({ message: 'Academic year is required.' });
        }
        
        // Fetch all schedules for this year with populated GradeLevel names
        const allSchedules = await Schedule.find({ academicYear })
            .populate('subject', 'name code')
            .populate('teacher', 'fullName')
            .populate('gradeLevel', 'name schoolLevel')
            .lean();

        // Group by Readable Grade Level Name
        const grouped = {};
        allSchedules.forEach(item => {
            const gradeName = item.gradeLevel?.name || 'Uncategorized';
            if (!grouped[gradeName]) grouped[gradeName] = [];
            grouped[gradeName].push(item);
        });

        res.json({ success: true, data: grouped });
    } catch (error) {
        console.error("getMasterSchedule error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Assign/Update a slot (Manual Override)
// @route   POST /api/schedule/assign
exports.assignSlot = async (req, res) => {
    const { gradeLevel, academicYear, dayOfWeek, period, subjectId, teacherId } = req.body;

    try {
        const targetGradeId = await resolveGradeLevelId(gradeLevel);
        if (!targetGradeId) {
            return res.status(400).json({ message: "Invalid Grade Level provided." });
        }

        // 1. Check if Teacher is busy in another class at this exact time
        const teacherConflict = await Schedule.findOne({
            teacher: teacherId,
            dayOfWeek,
            period,
            academicYear,
            gradeLevel: { $ne: targetGradeId }
        });

        if (teacherConflict) {
            return res.status(400).json({ message: "Teacher is busy in another class at this time!" });
        }

        // 2. Upsert slot using targetGradeId ObjectId
        const updatedSlot = await Schedule.findOneAndUpdate(
            { gradeLevel: targetGradeId, dayOfWeek, period, academicYear },
            { subject: subjectId, teacher: teacherId },
            { new: true, upsert: true, runValidators: true }
        )
        .populate('subject', 'name code')
        .populate('teacher', 'fullName')
        .populate('gradeLevel', 'name schoolLevel');

        res.json({ success: true, data: updatedSlot });

    } catch (error) {
        console.error("assignSlot error:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Clear a specific slot
// @route   DELETE /api/schedule/slot
exports.deleteSlot = async (req, res) => {
    const { gradeLevel, dayOfWeek, period, academicYear } = req.body;
    try {
        const targetGradeId = await resolveGradeLevelId(gradeLevel);
        await Schedule.findOneAndDelete({ gradeLevel: targetGradeId, dayOfWeek, period, academicYear });
        res.json({ success: true, message: "Slot cleared" });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Fisher-Yates shuffle
const shuffle = (arr) => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

// @desc    Auto-generate class schedules for KG or Primary/High School
// @route   POST /api/schedule/generate
exports.autoGenerateSchedule = async (req, res) => {
    const { academicYear, category } = req.body;

    if (!academicYear || !category) {
        return res.status(400).json({ message: 'Academic Year and Category are required.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Fetch Target GradeLevels directly from GradeLevel collection (New Architecture)
        const allGradeLevels = await GradeLevel.find({}).session(session);
        const isKgTarget = category.toLowerCase() === 'kg';

        const targetGrades = allGradeLevels.filter(gl => {
            const level = (gl.schoolLevel || '').toLowerCase();
            return isKgTarget ? level === 'kg' : (level === 'primary' || level === 'high school');
        });

        if (targetGrades.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: `No classes found for category: ${category}` });
        }

        const targetGradeIds = targetGrades.map(g => g._id);

        // 2. Clear Old Schedule for target grade levels in this year
        await Schedule.deleteMany({
            academicYear,
            gradeLevel: { $in: targetGradeIds },
        }, { session });

        // 3. Initialize Trackers
        const classOccupied = {};
        const teacherOccupied = {};
        
        for (const d of DAYS) {
            teacherOccupied[d] = {};
            for (const p of PERIODS) teacherOccupied[d][p] = new Set();
        }

        // 4. Fetch Teachers
        const teachers = await User.find({ role: 'teacher' }).populate('subjectsTaught.subject').session(session);
        const allSubjects = await Subject.find({}).session(session);

        const newSchedule = [];
        const summary = {}; 

        // 5. AUTO-SCHEDULING ALGORITHM
        for (const gradeDoc of targetGrades) {
            const gradeId = gradeDoc._id;
            const gradeName = gradeDoc.name;

            summary[gradeName] = 0;
            classOccupied[gradeId.toString()] = {};

            // Find Subjects assigned to this grade level via subject.gradeLevels array
            let subjectsForGrade = allSubjects.filter(s => 
                Array.isArray(s.gradeLevels) && s.gradeLevels.some(gl => gl.gradeLevel.equals(gradeId))
            );

            subjectsForGrade = shuffle(subjectsForGrade);

            for (const subj of subjectsForGrade) {
                if (!subj || !subj._id) continue;

                // Find assigned Teacher for this subject + grade level combination
                const assignedTeacher = teachers.find(t =>
                    Array.isArray(t.subjectsTaught) &&
                    t.subjectsTaught.some(st => {
                        const subjId = st.subject?._id || st.subject;
                        const stGradeId = st.gradeLevel?._id || st.gradeLevel;
                        return subjId && String(subjId) === String(subj._id) && stGradeId && String(stGradeId) === String(gradeId);
                    })
                );

                if (!assignedTeacher) continue;

                // Extract required sessions per week for this grade level
                const gradeConfig = subj.gradeLevels.find(gl => gl.gradeLevel.equals(gradeId));
                let sessionsNeeded = gradeConfig ? parseInt(gradeConfig.sessionsPerWeek, 10) : 3;

                const randomDays = shuffle([...DAYS]);

                for (const day of randomDays) {
                    if (sessionsNeeded <= 0) break;

                    classOccupied[gradeId.toString()][day] = classOccupied[gradeId.toString()][day] || {};

                    // Rule: Max 1 session per subject per day
                    const alreadyScheduledToday = newSchedule.some(s =>
                        String(s.gradeLevel) === String(gradeId) && 
                        s.dayOfWeek === day && 
                        String(s.subject) === String(subj._id)
                    );
                    
                    if (alreadyScheduledToday) continue;

                    const randomPeriods = shuffle([...PERIODS]);

                    for (const period of randomPeriods) {
                        if (classOccupied[gradeId.toString()][day][period]) continue;
                        if (teacherOccupied[day][period].has(String(assignedTeacher._id))) continue;

                        // Assign Slot
                        const slot = {
                            academicYear,
                            gradeLevel: gradeId,
                            dayOfWeek: day,
                            period,
                            subject: subj._id,
                            teacher: assignedTeacher._id,
                        };

                        newSchedule.push(slot);
                        
                        classOccupied[gradeId.toString()][day][period] = true;
                        teacherOccupied[day][period].add(String(assignedTeacher._id));
                        
                        sessionsNeeded--;
                        summary[gradeName] += 1;
                        break;
                    }
                }
            }
        }

        // 6. Save
        if (newSchedule.length > 0) {
            await Schedule.insertMany(newSchedule, { session });
            await session.commitTransaction();
            session.endSession();

            return res.status(201).json({
                success: true,
                message: `Generated ${category} schedule (${newSchedule.length} slots).`,
                count: newSchedule.length,
                summary 
            });
        } else {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                message: "Could not generate schedule. Ensure teachers are assigned to subjects and grade levels in Settings."
            });
        }

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        console.error("Auto-Schedule Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Get Schedule for a specific Teacher
// @route   GET /api/schedule/teacher
exports.getScheduleForTeacher = async (req, res) => {
    try {
        const response = await Schedule.find({ teacher: req.user._id })
            .populate('subject', 'name code')
            .populate('gradeLevel', 'name schoolLevel')
            .select('gradeLevel dayOfWeek period subject')
            .lean();

        res.status(200).json({ success: true, data: response });
    } catch (error) {
        res.status(500).json({ message: "Server error fetching teacher schedule" });
    }
};

// @desc    Get Schedule for a specific Class
// @route   GET /api/schedule/class/:gradeLevel
exports.getScheduleForClass = async (req, res) => {
    try {
        const targetGradeId = await resolveGradeLevelId(req.params.gradeLevel);

        const response = await Schedule.find({ gradeLevel: targetGradeId })
            .populate('subject', 'name code')
            .populate('teacher', 'fullName')
            .populate('gradeLevel', 'name schoolLevel')
            .select('dayOfWeek period subject teacher gradeLevel') 
            .lean();

        res.status(200).json({ success: true, data: response });
    } catch (error) {
        res.status(500).json({ message: "Server error fetching class schedule" });
    }
};