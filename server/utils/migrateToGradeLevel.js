// server/utils/migrateToGradeLevel.js
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Schedule = require('../models/Schedule');
const GradeLevel = require('../models/GradeLevel');

// Self-healing grade-level formatting helper
function formatGrade(input) {
  if (!input) return input;
  let formatted = input.trim().toLowerCase();
  formatted = formatted.replace(/-/g, ' ');
  formatted = formatted.replace(/\bgtade\b/g, 'grade');
  formatted = formatted.replace(/\b([a-z])/g, (match) => match.toUpperCase());
  formatted = formatted.replace(/\bKg\b/g, 'Kg');
  formatted = formatted.replace(/(\d)\s*([a-z])/gi, (match, num, letter) => {
    return num + letter.toUpperCase();
  });
  return formatted;
}

// Classifier helper to determine school level for new GradeLevel documents
const getSchoolSection = (gradeLevel) => {
    const grade = (gradeLevel || '').trim().toLowerCase();
    if (/^(kg|nursery|pre)/i.test(grade)) return 'kg';
    const match = grade.match(/\d+/);
    if (match) {
        const num = parseInt(match[0], 10);
        if (num >= 1 && num <= 8) return 'primary';
        if (num >= 9 && num <= 12) return 'high school';
    }
    return 'primary'; // Fallback
};

const runMigration = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) throw new Error("MONGO_URI not found in your .env file.");

        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoURI);
        console.log("Connected successfully.\n");

        // --- STEP 1: COMPILE AND CREATE UNIQUE GRADE LEVELS ---
        const allRawStudents = await Student.find({}).lean();
        const allRawSubjects = await Subject.find({}).lean();

        // Collect all active and historical grade level strings
        const rawGradesSet = new Set();
        allRawStudents.forEach(s => {
            if (s.gradeLevel) rawGradesSet.add(s.gradeLevel);
            if (Array.isArray(s.academicHistory)) {
                s.academicHistory.forEach(h => {
                    if (h.gradeAtThatTime) rawGradesSet.add(h.gradeAtThatTime);
                });
            }
        });
        allRawSubjects.forEach(s => {
            if (s.gradeLevel) rawGradesSet.add(s.gradeLevel);
        });

        const formattedGrades = Array.from(rawGradesSet).map(g => formatGrade(g)).filter(Boolean);
        const uniqueFormattedGrades = [...new Set(formattedGrades)];

        console.log(`Step 1: Found ${uniqueFormattedGrades.length} unique classes to register...`);
        const gradeLevelIdMap = {}; // Maps clean string ➔ ObjectId

        for (const gradeName of uniqueFormattedGrades) {
            let doc = await GradeLevel.findOne({ name: gradeName });
            if (!doc) {
                const schoolLevel = getSchoolSection(gradeName);
                doc = new GradeLevel({ name: gradeName, schoolLevel });
                await doc.save();
                console.log(`  [Created Class] "${gradeName}" (${schoolLevel})`);
            } else {
                console.log(`  [Verified Class] "${gradeName}" already exists.`);
            }
            gradeLevelIdMap[gradeName.toLowerCase()] = doc._id;
        }

        // Helper to safely fetch GradeLevel ObjectId from raw database string
        const getGradeObjectId = (rawString) => {
            if (!rawString) return null;
            const clean = formatGrade(rawString).toLowerCase();
            return gradeLevelIdMap[clean] || null;
        };

        // --- STEP 2: MIGRATE STUDENTS ---
        console.log("\nStep 2: Migrating students...");
        const students = await Student.find({});
        let studentCount = 0;

        for (const s of students) {
            let updated = false;

            // Update active gradeLevel reference to ObjectId
            const targetId = getGradeObjectId(s.gradeLevel);
            if (targetId && s.gradeLevel !== String(targetId)) {
                s.gradeLevel = targetId;
                updated = true;
            }

            // Update academicHistory array references to ObjectIds
            if (Array.isArray(s.academicHistory)) {
                s.academicHistory.forEach(history => {
                    const histId = getGradeObjectId(history.gradeAtThatTime);
                    if (histId && history.gradeAtThatTime !== String(histId)) {
                        history.gradeAtThatTime = histId;
                        updated = true;
                    }
                });
            }

            if (updated) {
                await s.save({ validateBeforeSave: false });
                studentCount++;
            }
        }
        console.log(`  Processed student records. Migrated ${studentCount} students.`);

        // --- STEP 3: CONVERT SUBJECTS (Option 1 ➔ Option 2) ---
        console.log("\nStep 3: Migrating subjects & merging duplicates into global catalog...");
        
        // Fetch all flat subject documents
        const oldSubjects = await Subject.find({});
        const subjectsByName = {};

        // Group the multiple separate subject documents by name
        oldSubjects.forEach(sub => {
            const cleanName = sub.name.trim();
            if (!subjectsByName[cleanName]) {
                subjectsByName[cleanName] = {
                    code: sub.code,
                    gradeLevels: []
                };
            }
            const gId = getGradeObjectId(sub.gradeLevel);
            if (gId) {
                subjectsByName[cleanName].gradeLevels.push({
                    gradeLevel: gId,
                    sessionsPerWeek: sub.sessionsPerWeek || 3
                });
            }
        });

        // Drop the old flat Subject collection to re-create it under the new schema
        await mongoose.connection.collection('subjects').drop().catch(() => {});
        console.log("  Dropped old flat subjects collection.");

        const subjectIdMap = {}; // Maps old subject names ➔ new unified ObjectIds

        for (const name of Object.keys(subjectsByName)) {
            const data = subjectsByName[name];
            const unifiedSub = new Subject({
                name,
                code: data.code,
                gradeLevels: data.gradeLevels
            });
            await unifiedSub.save();
            subjectIdMap[name.toLowerCase()] = unifiedSub._id;
            console.log(`  [Created Global Subject] "${name}" connected to ${data.gradeLevels.length} classes.`);
        }

        // --- STEP 4: MIGRATE SCHEDULES ---
        console.log("\nStep 4: Migrating schedule files...");
        const schedules = await Schedule.find({});
        let scheduleCount = 0;

        for (const sch of schedules) {
            let updated = false;

            // 1. Update gradeLevel string to GradeLevel ObjectId reference
            const classId = getGradeObjectId(sch.gradeLevel);
            if (classId && sch.gradeLevel !== String(classId)) {
                sch.gradeLevel = classId;
                updated = true;
            }

            // 2. Map old subject reference to the new unified global Subject ObjectID
            if (sch.subject) {
                const oldSub = oldSubjects.find(s => s._id.toString() === sch.subject.toString());
                if (oldSub) {
                    const newSubId = subjectIdMap[oldSub.name.trim().toLowerCase()];
                    if (newSubId) {
                        sch.subject = newSubId;
                        updated = true;
                    }
                }
            }

            if (updated) {
                await sch.save({ validateBeforeSave: false });
                scheduleCount++;
            }
        }
        console.log(`  Processed schedules. Migrated ${scheduleCount} slots.`);

        // --- STEP 5: MIGRATE TEACHERS (User subjectsTaught) ---
        console.log("\nStep 5: Migrating teacher subject assignments...");
        const teachers = await User.find({ role: 'teacher' });
        let teacherCount = 0;

        for (const t of teachers) {
            let updated = false;

            // Migrate homeroom grade string to GradeLevel ObjectId reference
            if (t.homeroomGrade) {
                const homeroomId = getGradeObjectId(t.homeroomGrade);
                if (homeroomId && t.homeroomGrade !== String(homeroomId)) {
                    t.homeroomGrade = homeroomId;
                    updated = true;
                }
            }

            // Map old subjectsTaught strings to the new { subject, gradeLevel } layout
            if (Array.isArray(t.subjectsTaught)) {
                const migratedTaught = [];
                t.subjectsTaught.forEach(assignment => {
                    const oldSub = oldSubjects.find(s => s._id.toString() === assignment.subject.toString());
                    if (oldSub) {
                        const newSubId = subjectIdMap[oldSub.name.trim().toLowerCase()];
                        const gradeId = getGradeObjectId(oldSub.gradeLevel);
                        if (newSubId && gradeId) {
                            migratedTaught.push({
                                subject: newSubId,
                                gradeLevel: gradeId
                            });
                            updated = true;
                        }
                    }
                });
                if (updated) {
                    t.subjectsTaught = migratedTaught;
                }
            }

            if (updated) {
                await t.save({ validateBeforeSave: false });
                teacherCount++;
            }
        }
        console.log(`  Processed teachers. Migrated ${teacherCount} assignments.`);

        console.log("\nMigration completed successfully! Please delete this script.");
        process.exi
    } catch (error) {
        console.error("\nMigration failed:", error);
        process.exit(1);
    }
};

runMigration();