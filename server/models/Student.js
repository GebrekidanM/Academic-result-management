// backend/models/Student.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ['Male', 'Female'] },
    dateOfBirth: { type: Date },
    gradeLevel: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ['Active', 'Graduated', 'Withdrawn'], default: 'Active' },
    password: { type: String, required: true, select: false },
    isInitialPassword: { type: Boolean, default: true },
    imageUrl: {
        type: String,
        default: '/images/students/default-avatar.png'
    },
    motherName: { type: String, trim: true, default: '' },
    motherContact: {type: String, trim: true, default: ''},
    fatherContact: {type: String, trim: true, default: ''},
    healthStatus: {
        type: String,
        trim: true,
        default: 'No known conditions'
    }

}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ✅ Hash password before saving (keep bcrypt cost reasonable)
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
  { fullName: 1, motherName: 1 , gradeLevel: 1},
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('Student', studentSchema);