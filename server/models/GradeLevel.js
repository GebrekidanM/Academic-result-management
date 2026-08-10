const mongoose = require('mongoose');

const gradeLevelSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Class name is required'], 
        unique: true,
        trim: true 
    },
    schoolLevel: {
        type: String, 
        required: true, 
        enum: ['kg', 'primary', 'high school'] 
    },
    roomNumber: { 
        type: String, 
        trim: true, 
        default: '' 
    },
    capacity: { 
        type: Number, 
        default: 40,
        min: [1, 'Capacity must be at least 1'] 
    }
}, { timestamps: true });

module.exports = mongoose.model('GradeLevel', gradeLevelSchema);