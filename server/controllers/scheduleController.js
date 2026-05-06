const Schedule = require('../models/Schedule');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Stream = require('../models/Stream');
const mongoose = require('mongoose');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

// @desc    Get Schedule for a specific Grade
// @route   GET /api/schedule/:gradeLevel
exports.getClassSchedule = async (req, res) => {
    try {
        const { academicYear, classId, streamId } = req.query;

        const schedule = await Schedule.find({ class: classId, stream: streamId, academicYear })
            .populate('subject', 'name')
            .populate('teacher', 'fullName')
            .lean();

        res.json({ success: true, data: schedule });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Master Schedule (All Grades)
// @route   GET /api/schedule/master
exports.getMasterSchedule = async (req, res) => {
    try {
        const { academicYear } = req.query;
        
        // Fetch everything for this year
        const allSchedules = await Schedule.find({ academicYear })
            .populate('subject', 'name')
            .populate('teacher', 'fullName')
            .lean();

        // Group by Class and Stream
        const grouped = {};
        allSchedules.forEach(item => {
            const key = `${item.class?._id || 'unknown'}-${item.stream?._id || 'unknown'}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
        });

        res.json({ success: true, data: grouped });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Assign/Update a slot (Manual Override)
// @route   POST /api/schedule/assign
exports.assignSlot = async (req, res) => {
    const { classId, streamId, academicYear, dayOfWeek, period, subjectId, teacherId } = req.body;

    try {
        // 1. Check if Teacher is busy elsewhere
        const teacherConflict = await Schedule.findOne({
            teacher: teacherId,
            dayOfWeek,
            period,
            academicYear,
            $or: [
                { class: { $ne: classId } },
                { stream: { $ne: streamId } }
            ]
        });

        if (teacherConflict) {
            return res.status(400).json({ message: "Teacher is busy in another class at this time!" });
        }

        // 2. Upsert (Update if exists, Insert if new)
        const updatedSlot = await Schedule.findOneAndUpdate(
            { class: classId, stream: streamId, dayOfWeek, period, academicYear },
            { subject: subjectId, teacher: teacherId },
            { new: true, upsert: true }
        ).populate('subject', 'name').populate('teacher', 'fullName');

        res.json({ success: true, data: updatedSlot });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Clear a specific slot
// @route   DELETE /api/schedule/slot
exports.deleteSlot = async (req, res) => {
    const { classId, streamId, dayOfWeek, period, academicYear } = req.body;
    try {
        await Schedule.findOneAndDelete({ class: classId, stream: streamId, dayOfWeek, period, academicYear });
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

// No longer needed with Class model having schoolLevel field


exports.autoGenerateSchedule = async (req, res) => {
    const { academicYear, category } = req.body;

    if (!academicYear || !category) {
        return res.status(400).json({ message: 'Academic Year and Category are required.' });
    }

    // Start a MongoDB session for database transactions
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Identify Target Classes
        const allSubjects = await Subject.find({}).session(session);
        const uniqueClassIds = [...new Set(allSubjects.map(s => s.class.toString()))];
        
        let targetClasses = [];
        if (category === 'KG') {
            targetClasses = await Class.find({ _id: { $in: uniqueClassIds }, schoolLevel: 'kg' }).session(session);
        } else {
            targetClasses = await Class.find({ _id: { $in: uniqueClassIds }, schoolLevel: { $ne: 'kg' } }).session(session);
        }

        if (targetClasses.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: `No classes found for category: ${category}` });
        }

        const targetClassIds = targetClasses.map(c => c._id);

        // 2. Clear Old Schedule (Protected by transaction)
        await Schedule.deleteMany({
            academicYear,
            class: { $in: targetClassIds },
        }, { session });

        // 3. Initialize Trackers
        const classOccupied = {};
        const teacherOccupied = {};
        
        for (const d of DAYS) {
            teacherOccupied[d] = {};
            for (const p of PERIODS) teacherOccupied[d][p] = new Set();
        }

        // 4. Fetch Teachers
        const teacherFilter = { role: 'teacher' };
        if (category === 'KG') {
            teacherFilter.schoolLevel = { $in: ['kg', 'all'] };
        } else {
            teacherFilter.schoolLevel = { $in:[/primary/i, /high school/i, 'all'] };
        }

        const teachers = await User.find(teacherFilter).populate('subjectsTaught.subject').session(session);
        const newSchedule =[];
        const summary = {}; 

        // 5. THE ALGORITHM
        for (const cls of targetClasses) {
            const streams = await Stream.find({ classId: cls._id }).session(session);
            
            for (const stream of streams) {
                const streamKey = `${cls.className}-${stream.streamName}`;
                summary[streamKey] = 0;
                classOccupied[streamKey] = {};

                // Get Subjects for this class
                let subjectsForClass = allSubjects.filter(s => s.class.toString() === cls._id.toString());
                subjectsForClass = shuffle(subjectsForClass);

                for (const subj of subjectsForClass) {
                    if (!subj || !subj._id) continue;

                    // Find Teacher
                    const assignedTeacher = teachers.find(t =>
                        Array.isArray(t.subjectsTaught) &&
                        t.subjectsTaught.some(st => {
                            const subjId = st && st.subject && st.subject._id ? st.subject._id : st.subject;
                            return subjId && String(subjId) === String(subj._id);
                        })
                    );

                    if (!assignedTeacher) continue;

                    // Determine Load
                    let sessionsNeeded = parseInt(subj.sessionsPerWeek || (category === 'KG' ? 3 : 4), 10);
                    const randomDays = shuffle([...DAYS]);

                    for (const day of randomDays) {
                        if (sessionsNeeded <= 0) break;

                        classOccupied[streamKey][day] = classOccupied[streamKey][day] || {};

                        // Rule: One Subject Per Day Check
                        const alreadyScheduledToday = newSchedule.some(s =>
                            String(s.class) === String(cls._id) && 
                            String(s.stream) === String(stream._id) && 
                            s.dayOfWeek === day && 
                            String(s.subject) === String(subj._id)
                        );
                        
                        if (alreadyScheduledToday) continue;

                        const randomPeriods = shuffle([...PERIODS]);

                        for (const period of randomPeriods) {
                            if (classOccupied[streamKey][day][period]) continue;
                            if (teacherOccupied[day][period].has(String(assignedTeacher._id))) continue;

                            newSchedule.push({
                                academicYear,
                                class: cls._id,
                                stream: stream._id,
                                dayOfWeek: day,
                                period,
                                subject: subj._id,
                                teacher: assignedTeacher._id,
                            });
                            
                            classOccupied[streamKey][day][period] = true;
                            teacherOccupied[day][period].add(String(assignedTeacher._id));
                            
                            sessionsNeeded--;
                            summary[streamKey] += 1;
                            
                            break;
                        }
                    }
                }
            }
        }

        // 6. Save
        if (newSchedule.length > 0) {
            // Save to DB using the transaction session
            await Schedule.insertMany(newSchedule, { session });
            
            // Commit the transaction - effectively finalizing the deletion and insertion
            await session.commitTransaction();
            session.endSession();

            return res.status(201).json({
                success: true,
                message: `Generated ${category} schedule (${newSchedule.length} slots).`,
                count: newSchedule.length,
                summary 
            });
        } else {
            // Abort transaction - restores the old schedule since generation failed
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                message: "Could not generate schedule. Ensure teachers are assigned to subjects."
            });
        }

    } catch (error) {
        // Rollback transaction on unexpected errors
        await session.abortTransaction();
        session.endSession();
        
        console.error("Auto-Schedule Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};