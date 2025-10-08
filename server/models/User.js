const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },

    // ✅ lowercase ensures consistent storage
    username: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },

    password: { type: String, required: true, select: false },

    role: { 
        type: String, 
        required: true, 
        enum: ['admin', 'teacher'], 
        default: 'teacher' 
    },

    homeroomGrade: { type: String, default: null },

    subjectsTaught: [{
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        },
        _id: false
    }]
}, { timestamps: true });

// ✅ Hash password before saving (keep bcrypt cost reasonable)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(8); // 🔥 reduced from 10 to 8 for faster hashing
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ✅ Compare password efficiently
userSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

// ✅ Ensure case-insensitive uniqueness for username
userSchema.index(
  { username: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('User', userSchema);
