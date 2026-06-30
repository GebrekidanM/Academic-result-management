// backend/models/Student.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');

const studentSchema = new mongoose.Schema({
    studentId: { type: String, unique: true }, 
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ['Male', 'Female'] },
    dateOfBirth: { type: Date },
    gradeLevel: { type: String, required: true, trim: true },
    
    year: { type: String, required: true }, 

    status: { type: String, required: true, enum: ['Active', 'Graduated', 'Withdrawn','Changed'], default: 'Active' },
    password: { type: String, required: true, select: false },
    isInitialPassword: { type: Boolean, default: true },
    imageUrl: { type: String, default: '/images/students/default-avatar.png' },
    
    motherName: { type: String, trim: true, defualt: '' }, 
    motherContact: { type: String, trim: true, default: '' },
    fatherContact: { type: String, trim: true, default: '' },
    healthStatus: { type: String, trim: true, default: 'No known conditions' },
    academicHistory: [{year: String, gradeAtThatTime: String, statusAtEnd: String,}],
    transferLetterUrl: { type: String, default: '' },
    transferLetterPublicId: { type: String, default: '' },
    certificateUrl: { type: String, default: '' },
    certificatePublicId: { type: String, default: '' },
    nationalIdUrl: { type: String, default: '' },
    nationalIdPublicId: { type: String, default: '' }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

studentSchema.pre('save', async function (next) {
    if (!this.isNew) return next();

    const currentYear = this.year; 
    const counterId = `studentId_${currentYear}`;
    let counter;

    try {
        counter = await Counter.findOneAndUpdate(
            { id: counterId },
            { $inc: { seq: 1 } },
            { new: true }
        );

        if (!counter) {
            const lastStudent = await mongoose.model('Student').findOne({
                studentId: new RegExp(`^FKS-${currentYear}`)
            }).sort({ studentId: -1 });

            let lastSeq = 0;
            if (lastStudent && lastStudent.studentId) {
                const parts = lastStudent.studentId.split('-');
                if (parts.length === 3) {
                    lastSeq = parseInt(parts[2], 10);
                }
            }

            try {
                counter = await Counter.create({
                    id: counterId,
                    seq: lastSeq + 1
                });
            } catch (createError) {
                if (createError.code === 11000) {
                    counter = await Counter.findOneAndUpdate(
                        { id: counterId },
                        { $inc: { seq: 1 } },
                        { new: true }
                    );
                } else {
                    throw createError;
                }
            }
        }

        const seqId = counter.seq.toString().padStart(3, '0');
        this.studentId = `FKS-${currentYear}-${seqId}`;
        
        next();
    } catch (error) {
        next(error);
    }
});

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