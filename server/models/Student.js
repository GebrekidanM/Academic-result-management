// backend/models/Student.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ['Male', 'Female'] },
    dateOfBirth: { type: Date, required: true },
    gradeLevel: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ['Active', 'Graduated', 'Withdrawn'], default: 'Active' },
    password: { type: String, required: true, select: false },
    isInitialPassword: { type: Boolean, default: true },
    imageUrl: {
        type: String,
        default: '/images/students/default-avatar.png'
    },

    parentContact: {
        parentName: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' }
    },

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

studentSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);