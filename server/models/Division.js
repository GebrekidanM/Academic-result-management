const mongoose = require('mongoose');

const divisionRangeSchema = new mongoose.Schema({
    division: { type: String, required: true },
    minScore: { type: Number, required: true },
    maxScore: { type: Number, required: true }
}, { _id: false });

const divisionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        default: 'Primary P4-P7'
    },
    schoolLevel: {
        type: String,
        required: true,
        enum: ['kg', 'primary', 'High School', 'all'],
        default: 'primary'
    },
    applicableClasses: {
        type: [String],
        default: ['P4', 'P5', 'P6', 'P7']
    },
    ranges: {
        type: [divisionRangeSchema],
        required: true,
        default: [
            { division: 'Div 1', minScore: 4, maxScore: 12 },
            { division: 'Div 2', minScore: 13, maxScore: 24 },
            { division: 'Div 3', minScore: 25, maxScore: 29 },
            { division: 'Div 4', minScore: 30, maxScore: 33 },
            { division: 'Div U', minScore: 34, maxScore: 36 }
        ]
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Division', divisionSchema);
