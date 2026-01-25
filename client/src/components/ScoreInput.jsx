// src/components/ScoreInput.jsx
import React from 'react';

const LETTER_GRADES = ["A", "B", "C", "D","F"]; // Adjust as needed: ["E", "VG", "G", "NI"]

const ScoreInput = ({ gradingType, value, onChange, maxMarks }) => {
    // 1. DESCRIPTIVE (Letters)
    if (gradingType === 'descriptive') {
        return (
            <select 
                value={value || ''} 
                onChange={(e) => onChange(e.target.value)}
                className="w-24 p-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 font-bold text-center"
            >
                <option value="">-</option>
                {LETTER_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
        );
    }
    // 2. NUMERIC (Numbers)
    return (
        <input 
            type="number" 
            min="0" 
            max={maxMarks} 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)}
            placeholder={`/ ${maxMarks}`}
            className="w-24 text-center border-2 border-gray-300 rounded-md p-1 focus:ring-2 focus:ring-pink-500 font-bold"
        />
    );
};

export default ScoreInput;