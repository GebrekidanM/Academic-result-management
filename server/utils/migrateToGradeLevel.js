// server/utils/migrateToGradeLevel.js
require('dotenv').config();
const mongoose = require('mongoose');

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
    return 'primary';
};

// Formatting helper
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

const runMigration = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) throw new Error("MONGO_URI not found in your .env file.");

        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoURI);
        console.log("Connected successfully.\n");

        const db = mongoose.connection.db;
        const studentsColl = db.collection('students');
        const subjectsColl = db.collection('subjects');
        const gradeLevelsColl = db.collection('gradelevels');
        const schedulesColl = db.collection('schedules');
        const usersColl = db.collection('users');

        // --- STEP 1: COMPILE AND CREATE UNIQUE GRADE LEVELS ---
        const allRawStudents = await studentsColl.find({}).toArray();
        const allRawSubjects = await subjectsColl.find({}).toArray();
        const allRawSchedules = await schedulesColl.find({}).toArray();

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
        allRawSchedules.forEach(s => {
            if (s.gradeLevel) rawGradesSet.add(s.gradeLevel);
        });

        const formattedGrades = Array.from(rawGradesSet).map(g => formatGrade(g)).filter(Boolean);
        const uniqueFormattedGrades = [...new Set(formattedGrades)];

        console.log(`Step 1: Found ${uniqueFormattedGrades.length} unique classes to register...`);
        const gradeLevelIdMap = {}; // Maps clean string ➔ ObjectId

        for (const gradeName of uniqueFormattedGrades) {
            let doc = await gradeLevelsColl.findOne({ name: gradeName });
            if (!doc) {
                const schoolLevel = getSchoolSection(gradeName);
                const newDoc = {
                    name: gradeName,
                    schoolLevel,
                    roomNumber: '',
                    capacity: 40,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                const result = await gradeLevelsColl.insertOne(newDoc);
                doc = { _id: result.insertedId, name: gradeName };
                console.log(`  [Created Class] "${gradeName}" (${schoolLevel})`);
            } else {
                console.log(`  [Verified Class] "${gradeName}" already exists.`);
            }
            gradeLevelIdMap[gradeName.toLowerCase()] = doc._id;
        }

        const getGradeObjectId = (rawString) => {
            if (!rawString) return null;
            if (typeof rawString === 'object' && rawString._id) return rawString._id;
            if (mongoose.Types.ObjectId.isValid(rawString) && String(rawString).length === 24) {
                return new mongoose.Types.ObjectId(rawString);
            }
            const clean = formatGrade(String(rawString)).toLowerCase();
            return gradeLevelIdMap[clean] || null;
        };

        // --- STEP 2: MIGRATE STUDENTS ---
        console.log("\nStep 2: Migrating students...");
        const students = await studentsColl.find({}).toArray();
        let studentCount = 0;

        for (const s of students) {
            let needsUpdate = false;
            let targetId = getGradeObjectId(s.gradeLevel);

            let updatedHistory = s.academicHistory;
            if (Array.isArray(s.academicHistory)) {
                updatedHistory = s.academicHistory.map(history => {
                    const histId = getGradeObjectId(history.gradeAtThatTime);
                    if (histId) {
                        needsUpdate = true;
                        return { ...history, gradeAtThatTime: histId };
                    }
                    return history;
                });
            }

            if (targetId || needsUpdate) {
                await studentsColl.updateOne(
                    { _id: s._id },
                    { 
                        $set: { 
                            ...(targetId ? { gradeLevel: targetId } : {}),
                            ...(updatedHistory ? { academicHistory: updatedHistory } : {})
                        } 
                    }
                );
                studentCount++;
            }
        }
        console.log(`  Processed student records. Migrated ${studentCount} students.`);

        // --- STEP 3: CONVERT SUBJECTS & MERGE DUPLICATES ---
        console.log("\nStep 3: Migrating subjects & merging duplicates into global catalog...");
        
        const oldSubjects = await subjectsColl.find({}).toArray();
        const subjectsByName = {};

        oldSubjects.forEach(sub => {
            const cleanName = sub.name.trim();
            const key = cleanName.toLowerCase();

            if (!subjectsByName[key]) {
                subjectsByName[key] = {
                    name: cleanName,
                    code: sub.code || '',
                    gradeLevels: []
                };
            }

            const gId = getGradeObjectId(sub.gradeLevel);
            if (gId) {
                const exists = subjectsByName[key].gradeLevels.some(g => g.gradeLevel.equals(gId));
                if (!exists) {
                    subjectsByName[key].gradeLevels.push({
                        gradeLevel: gId,
                        sessionsPerWeek: Number(sub.sessionsPerWeek) || 3
                    });
                }
            }
        });

        // Drop old collection and recreate unified documents
        await subjectsColl.drop().catch(() => {});
        console.log("  Dropped old flat subjects collection.");

        const subjectIdMap = {}; // Maps subject names -> new ObjectId

        for (const key of Object.keys(subjectsByName)) {
            const data = subjectsByName[key];
            const newDoc = {
                name: data.name,
                code: data.code,
                gradeLevels: data.gradeLevels,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const result = await subjectsColl.insertOne(newDoc);
            subjectIdMap[key] = result.insertedId;
            console.log(`  [Created Global Subject] "${data.name}" connected to ${data.gradeLevels.length} classes.`);
        }

        // --- STEP 4: MIGRATE SCHEDULES ---
        console.log("\nStep 4: Migrating schedule files...");
        const schedules = await schedulesColl.find({}).toArray();
        let scheduleCount = 0;

        for (const sch of schedules) {
            let classId = getGradeObjectId(sch.gradeLevel);
            let newSubId = null;

            // Map old subject reference to the new unified global Subject ObjectID
            if (sch.subject) {
                const oldSub = oldSubjects.find(s => s._id.toString() === sch.subject.toString());
                if (oldSub) {
                    newSubId = subjectIdMap[oldSub.name.trim().toLowerCase()];
                } else if (typeof sch.subject === 'string' || (sch.subject && sch.subject._bsontype === 'ObjectID')) {
                    newSubId = sch.subject;
                }
            }

            if (classId && newSubId) {
                // Auto-link Subject to Grade Level if missing so Schedule constraints are satisfied
                await subjectsColl.updateOne(
                    { _id: newSubId, 'gradeLevels.gradeLevel': { $ne: classId } },
                    { $push: { gradeLevels: { gradeLevel: classId, sessionsPerWeek: 3 } } }
                );

                // Update schedule directly in native MongoDB
                await schedulesColl.updateOne(
                    { _id: sch._id },
                    {
                        $set: {
                            gradeLevel: classId,
                            subject: newSubId
                        }
                    }
                );
                scheduleCount++;
            }
        }
        console.log(`  Processed schedules. Migrated ${scheduleCount} slots.`);

        // --- STEP 5: MIGRATE TEACHERS ---
        console.log("\nStep 5: Migrating teacher subject assignments...");
        const teachers = await usersColl.find({ role: 'teacher' }).toArray();
        let teacherCount = 0;

        for (const t of teachers) {
            let needsUpdate = false;
            let homeroomId = getGradeObjectId(t.homeroomGrade);

            let migratedTaught = t.subjectsTaught;
            if (Array.isArray(t.subjectsTaught)) {
                migratedTaught = [];
                t.subjectsTaught.forEach(assignment => {
                    const oldSub = oldSubjects.find(s => s._id.toString() === assignment.subject?.toString());
                    if (oldSub) {
                        const newSubId = subjectIdMap[oldSub.name.trim().toLowerCase()];
                        const gradeId = getGradeObjectId(oldSub.gradeLevel) || getGradeObjectId(assignment.gradeLevel);
                        if (newSubId && gradeId) {
                            migratedTaught.push({
                                subject: newSubId,
                                gradeLevel: gradeId
                            });
                            needsUpdate = true;
                        }
                    }
                });
            }

            if (homeroomId || needsUpdate) {
                await usersColl.updateOne(
                    { _id: t._id },
                    {
                        $set: {
                            ...(homeroomId ? { homeroomGrade: homeroomId } : {}),
                            ...(needsUpdate ? { subjectsTaught: migratedTaught } : {})
                        }
                    }
                );
                teacherCount++;
            }
        }
        console.log(`  Processed teachers. Migrated ${teacherCount} assignments.`);

        console.log("\n🎉 Migration completed successfully!");
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

runMigration();