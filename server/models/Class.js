const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    className: { 
        type: String, 
        required: true, 
        trim: true,
        unique: true
    },
    schoolLevel: { 
        type: String, 
        required: true,
        enum: ['kg', 'primary', 'High School', 'all'],
        default: 'primary'
    }
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
