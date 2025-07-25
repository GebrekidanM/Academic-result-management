const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female'] },
    dateOfBirth: { type: Date, required: true },
    gradeLevel: { type: String, required: true },
    status: { type: String, required: true, enum: ['Active', 'Graduated', 'Withdrawn'], default: 'Active' },
    password: { type: String, required: true, select: false },
    isInitialPassword: { type: Boolean, default: true }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


// NOTE: This logic is now non-functional because virtuals cannot be async.
// We will move the calculation logic to the controller, which is a better practice.
// For now, we define a simple virtual that will be populated by the controller.
studentSchema.virtual('promotionStatus');
studentSchema.virtual('overallAverage');

// --- PASSWORD HASHING MIDDLEWARE ---
// This runs before a new student is saved
studentSchema.pre('save', async function (next) {
    // Only hash the password if it's new or has been modified
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare login password with the hashed password
studentSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);

