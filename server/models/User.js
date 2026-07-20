const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    imageUrl: { type: String, default: '/images/students/default-avatar.png' },
    password: { type: String, required: true, select: false },
    pushSubscription: { type: Object }, 
    
    email: { type: String, trim: true, lowercase: true, default: '' },
    phoneNumber: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    isInitialPassword: { type: Boolean, default: true },

    schoolLevel: { type: String, required: true, enum: ['kg', 'primary', 'High School', 'all'], default: 'primary' },
    role: { type: String, required: true, enum: ['admin', 'teacher', 'staff', 'accountant'], default: 'teacher' },
    homeroomGrade: { type: String, default: null },
    subjectsTaught: [{
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        _id: false
    }]
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(8);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);