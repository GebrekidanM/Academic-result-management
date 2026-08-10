// utils/migrateSubjectSchema.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function migrateSubjectsToNewSchema() {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL;

    if (!mongoUri) {
        console.error("❌ MONGO_URI missing from .env");
        process.exit(1);
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        
        const db = mongoose.connection.db;
        const subjectsColl = db.collection('subjects');
        const gradeLevelsColl = db.collection('gradelevels');

        // 1. Fetch GradeLevels and create lookup map (name/id -> ObjectId)
        const gradeLevels = await gradeLevelsColl.find({}).toArray();
        const gradeMap = new Map();
        gradeLevels.forEach(gl => {
            gradeMap.set(gl.name.toLowerCase().trim(), gl._id);
            gradeMap.set(gl._id.toString(), gl._id);
        });

        console.log(`Loaded ${gradeLevels.length} GradeLevels from database.`);

        // 2. Fetch all raw subjects
        const rawSubjects = await subjectsColl.find({}).toArray();
        console.log(`Scanning ${rawSubjects.length} raw subject documents...`);

        // Group subjects by normalized name (to enforce unique names)
        const groupedSubjects = new Map();

        for (const sub of rawSubjects) {
            const normalizedName = sub.name.trim();
            const key = normalizedName.toLowerCase();

            if (!groupedSubjects.has(key)) {
                groupedSubjects.set(key, {
                    primaryId: sub._id,
                    name: normalizedName,
                    code: sub.code || "",
                    gradeLevels: [],
                    allDocIds: [sub._id]
                });
            } else {
                groupedSubjects.get(key).allDocIds.push(sub._id);
            }

            const currentGroup = groupedSubjects.get(key);

            // Process old top-level gradeLevel string/ObjectId if present
            if (sub.gradeLevel) {
                let glId = null;
                if (typeof sub.gradeLevel === 'string') {
                    const searchKey = sub.gradeLevel.toLowerCase().trim();
                    glId = gradeMap.get(searchKey);
                } else if (sub.gradeLevel && sub.gradeLevel._bsontype === 'ObjectID') {
                    glId = sub.gradeLevel;
                }

                if (glId) {
                    const sessions = Number(sub.sessionsPerWeek) || 3;
                    const exists = currentGroup.gradeLevels.some(g => g.gradeLevel.equals(glId));
                    if (!exists) {
                        currentGroup.gradeLevels.push({
                            gradeLevel: glId,
                            sessionsPerWeek: sessions
                        });
                    }
                } else {
                    console.warn(`⚠️ Warning: Could not resolve GradeLevel "${sub.gradeLevel}" for subject "${sub.name}"`);
                }
            }
            
            // Preserve existing gradeLevels array items if any exist
            if (Array.isArray(sub.gradeLevels)) {
                sub.gradeLevels.forEach(g => {
                    const glId = g.gradeLevel;
                    const sessions = g.sessionsPerWeek || 3;
                    if (glId) {
                        const exists = currentGroup.gradeLevels.some(existing => existing.gradeLevel.equals(glId));
                        if (!exists) {
                            currentGroup.gradeLevels.push({
                                gradeLevel: glId,
                                sessionsPerWeek: sessions
                            });
                        }
                    }
                });
            }
        }

        console.log(`Grouped into ${groupedSubjects.size} unique subject names.\n`);

        for (const [key, group] of groupedSubjects.entries()) {
            const primaryId = group.primaryId;
            const duplicateIds = group.allDocIds.filter(id => !id.equals(primaryId));

            // Delete duplicate documents for the same subject name
            if (duplicateIds.length > 0) {
                await subjectsColl.deleteMany({ _id: { $in: duplicateIds } });
                console.log(`🗑️ Merged and removed ${duplicateIds.length} duplicate document(s) for "${group.name}"`);
            }

            // Update primary document to new schema structure and unset old fields
            await subjectsColl.updateOne(
                { _id: primaryId },
                {
                    $set: {
                        name: group.name,
                        code: group.code,
                        gradeLevels: group.gradeLevels
                    },
                    $unset: {
                        gradeLevel: "",       // Removes old top-level string field
                        sessionsPerWeek: ""   // Removes old top-level number field
                    }
                }
            );

            console.log(`✅ Migrated "${group.name}": Linked ${group.gradeLevels.length} grade level(s).`);
        }

        console.log("\n=================================");
        console.log("🎉 Subject Schema Migration Complete!");
        console.log("=================================\n");

    } catch (error) {
        console.error("❌ Migration error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrateSubjectsToNewSchema();