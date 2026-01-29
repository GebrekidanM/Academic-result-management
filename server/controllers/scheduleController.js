const Schedule = require('../models/Schedule');
const User = require('../models/User');
const Subject = require('../models/Subject');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

// @desc    Get Schedule for a specific Grade
// @route   GET /api/schedule/:gradeLevel
exports.getClassSchedule = async (req, res) => {
    try {
        const { academicYear,gradeLevel } = req.query;

        const schedule = await Schedule.find({ gradeLevel, academicYear })
            .populate('subject', 'name')
            .populate('teacher', 'fullName')
            .lean();

        res.json({ success: true, data: schedule });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Assign/Update a slot (Manual Override)
// @route   POST /api/schedule/assign
exports.assignSlot = async (req, res) => {
    const { gradeLevel, academicYear, dayOfWeek, period, subjectId, teacherId } = req.body;

    try {
        // 1. Check if Teacher is busy elsewhere
        const teacherConflict = await Schedule.findOne({
            teacher: teacherId,
            dayOfWeek,
            period,
            academicYear,
            gradeLevel: { $ne: gradeLevel } // Conflict if they are in another class
        });

        if (teacherConflict) {
            return res.status(400).json({ message: "Teacher is busy in another class at this time!" });
        }

        // 2. Upsert (Update if exists, Insert if new)
        const updatedSlot = await Schedule.findOneAndUpdate(
            { gradeLevel, dayOfWeek, period, academicYear },
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
    const { gradeLevel, dayOfWeek, period, academicYear } = req.body;
    try {
        await Schedule.findOneAndDelete({ gradeLevel, dayOfWeek, period, academicYear });
        res.json({ success: true, message: "Slot cleared" });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// const SUBJECT_LOAD = { ... }; 

// Helper: Shuffle
const shuffle = (array) => array.sort(() => Math.random() - 0.5);
// Helper: Identify KG vs Grade
const isKG = (gradeLevel) => /^(kg|nursery|pre)/i.test(gradeLevel);

exports.autoGenerateSchedule = async (req, res) => {
    // category can be 'KG' or 'Grade'
    const { academicYear, category } = req.body; 

    if (!academicYear || !category) {
        return res.status(400).json({ message: 'Academic Year and Category (KG/Grade) are required.' });
    }

    try {
        // 1. Identify Target Grade Levels
        const allSubjects = await Subject.find({});
        const allGradeLevels = [...new Set(allSubjects.map(s => s.gradeLevel))];

        let targetGrades = [];
        if (category === 'KG') {
            targetGrades = allGradeLevels.filter(g => isKG(g));
        } else {
            targetGrades = allGradeLevels.filter(g => !isKG(g));
        }

        if (targetGrades.length === 0) {
            return res.status(404).json({ message: `No classes found for category: ${category}` });
        }

        // 2. CLEAR OLD SCHEDULE (Only for target grades)
        // We delete only the schedule for the selected category.
        await Schedule.deleteMany({ 
            academicYear, 
            gradeLevel: { $in: targetGrades } 
        });

        // 3. INITIALIZE TRACKERS (Fresh start for this category)
        const teacherOccupied = {}; 
        DAYS.forEach(d => {
            teacherOccupied[d] = {};
            PERIODS.forEach(p => teacherOccupied[d][p] = new Set());
        });

        // 4. FETCH TEACHERS
         let teacherFilter = { role: 'teacher' };

        if (category === 'Kg') {
            // If generating KG schedule, get KG teachers + 'All'
            teacherFilter.schoolLevel = { $in: ['kg', 'all'] };
        } else {
            // If generating Grade schedule, get Primary/High School + 'All'
            teacherFilter.schoolLevel = { $in: ['primary', 'high_school', 'all'] };
        }
        const teachers = await User.find(teacherFilter).populate('subjectsTaught.subject');
        if(teachers.length === 0) return res.status(404).json({message:"No teacher assigned for this school level"});
        
        const newSchedule = [];

        // 5. THE ALGORITHM
        for (const grade of targetGrades) {
            
            // Get subjects for this specific grade
            const subjectsForGrade = allSubjects.filter(s => s.gradeLevel === grade);

            for (const subj of subjectsForGrade) {
                
                // Find a teacher assigned to this Subject AND this Grade Level
                const assignedTeacher = teachers.find(t => 
                    t.subjectsTaught.some(st => st.subject && st.subject._id.equals(subj._id))
                );

                if (!assignedTeacher) {
                    // Optional: Log warning if a subject has no teacher
                    // console.warn(`No teacher for ${subj.name} in ${grade}`);
                    continue; 
                }

                // Use dynamic load from Subject DB, or default based on category
                let sessionsNeeded = subj.sessionsPerWeek || (category === 'KG' ? 3 : 4); 

                const randomDays = shuffle([...DAYS]);

                for (const day of randomDays) {
                    if (sessionsNeeded === 0) break;
                    
                    // Rule: Max 1 session per day per subject (Spread it out)
                    const alreadyScheduledToday = newSchedule.some(s => 
                        s.gradeLevel === grade && s.dayOfWeek === day && s.subject.equals(subj._id)
                    );
                    if (alreadyScheduledToday) continue;

                    const randomPeriods = shuffle([...PERIODS]);

                    for (const period of randomPeriods) {
                        if (sessionsNeeded === 0) break;

                        // --- CONFLICT CHECKS ---

                        // 1. Is the Class busy?
                        const classBusy = newSchedule.some(s => 
                            s.gradeLevel === grade && s.dayOfWeek === day && s.period === period
                        );
                        if (classBusy) continue;

                        // 2. Is the Teacher busy?
                        // We only check against the current generation process since teachers don't overlap categories
                        if (teacherOccupied[day][period].has(assignedTeacher._id.toString())) continue;

                        // --- ASSIGN ---
                        newSchedule.push({
                            academicYear,
                            gradeLevel: grade,
                            dayOfWeek: day,
                            period: period,
                            subject: subj._id,
                            teacher: assignedTeacher._id
                        });

                        teacherOccupied[day][period].add(assignedTeacher._id.toString());
                        sessionsNeeded--;
                    }
                }
            }
        }

        // 6. SAVE
        if (newSchedule.length > 0) {
            await Schedule.insertMany(newSchedule);
            res.status(201).json({ 
                success: true, 
                message: `Generated ${category} schedule (${newSchedule.length} slots).`,
                count: newSchedule.length
            });
        } else {
            res.status(400).json({ message: "Could not generate. Check if teachers are assigned to subjects." });
        }

    } catch (error) {
        console.error("Auto-Schedule Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};