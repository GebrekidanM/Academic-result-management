// backend/models/Student.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter'); // <--- IMPORT THE COUNTER MODEL

const studentSchema = new mongoose.Schema({
    // Remove 'required: true' from studentId because we will generate it automatically
    studentId: { type: String, unique: true }, 
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ['Male', 'Female'] },
    dateOfBirth: { type: Date },
    gradeLevel: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ['Active', 'Graduated', 'Withdrawn'], default: 'Active' },
    password: { type: String, required: true, select: false },
    isInitialPassword: { type: Boolean, default: true },
    imageUrl: { type: String, default: '/images/students/default-avatar.png' },
    motherName: { type: String, trim: true, default: '' },
    motherContact: { type: String, trim: true, default: '' },
    fatherContact: { type: String, trim: true, default: '' },
    healthStatus: { type: String, trim: true, default: 'No known conditions' }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ✅ 1. AUTOMATIC ID GENERATOR HOOK
studentSchema.pre('save', async function (next) {
    if (!this.isNew) return next();

    // 1. Calculate Ethiopian Year
    const today = new Date();
    const gregorianYear = today.getFullYear();
    const gregorianMonth = today.getMonth() + 1;
    const currentYear = gregorianMonth > 8 ? gregorianYear - 7 : gregorianYear - 8;

    const counterId = `studentId_${currentYear}`;

    try {
        // 2. Try to find and increment the counter atomically
        let counter = await Counter.findOneAndUpdate(
            { id: counterId },
            { $inc: { seq: 1 } },
            { new: true }
        );

        // 3. 🚨 SELF-HEALING LOGIC 🚨
        // If counter doesn't exist (first run after deployment), initialize it!
        if (!counter) {
            // Find the LAST student created in this year
            const lastStudent = await mongoose.model('Student').findOne({
                studentId: new RegExp(`^FKS-${currentYear}`)
            }).sort({ studentId: -1 });

            // Extract the sequence number (e.g., FKS-2017-050 -> 50)
            let lastSeq = 0;
            if (lastStudent && lastStudent.studentId) {
                const parts = lastStudent.studentId.split('-');
                if (parts.length === 3) {
                    lastSeq = parseInt(parts[2], 10);
                }
            }

            // Create the counter starting from the last known sequence + 1
            counter = await Counter.create({
                id: counterId,
                seq: lastSeq + 1
            });
        }

        // 4. Generate the ID
        const seqId = counter.seq.toString().padStart(3, '0');
        this.studentId = `FKS-${currentYear}-${seqId}`;
        
        next();
    } catch (error) {
        // If 2 people try to initialize at the exact same millisecond, retry
        if (error.code === 11000) {
            return next(new Error("Race condition detected during initialization. Please try again."));
        }
        next(error);
    }
});

// ✅ 2. Hash password before saving
studentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(8);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

studentSchema.index(
    { fullName: 1, motherName: 1, gradeLevel: 1 },
    { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('Student', studentSchema);