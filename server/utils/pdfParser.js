const pdf = require('pdf-parse');

/**
 * Parses PDF text into a structured format for grading.
 */
exports.parseGradesPdf = async (buffer) => {
    let extractedText = '';
    try {
        const { PDFParse } = pdf;
        if (PDFParse && typeof PDFParse === 'function') {
            // Convert Buffer to Uint8Array for Mehmet Kozan's version
            const uint8Array = new Uint8Array(buffer);
            const parser = new PDFParse(uint8Array);
            const result = await parser.getText();
            extractedText = result.text;
        } else if (typeof pdf === 'function') {
            // This is the standard pdf-parse version
            const data = await pdf(buffer);
            extractedText = data.text;
        } else {
            console.log("PDF Library Keys:", Object.keys(pdf));
            throw new Error("PDF parsing library not recognized.");
        }
    } catch (err) {
        console.error("PDF Read Error:", err);
        throw new Error("Failed to read PDF file: " + err.message);
    }

    const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 1. Identify Headers
    const commonSubjects = ['maths', 'mathematics', 'english', 'science', 'social studies', 'sst', 'literacy', 're'];
    let headerLineIndex = -1;

    for (let i = 0; i < Math.min(lines.length, 100); i++) {
        const line = lines[i].toLowerCase();
        const subjectsFound = commonSubjects.filter(s => line.includes(s));
        if (subjectsFound.length >= 3) {
            headerLineIndex = i;
            break;
        }
    }

    // Fallback: If headers are vertical, they might appear as separate lines
    if (headerLineIndex === -1) {
         for (let i = 0; i < lines.length; i++) {
             const parts = lines[i].split(/\s+/);
             if (/^\d+$/.test(parts[0]) && parts.length > 3) {
                 headerLineIndex = i; 
                 break;
             }
         }
    }

    if (headerLineIndex === -1) {
        throw new Error("Could not identify the start of the grade table in the PDF.");
    }

    // 2. Parse Student Rows
    const studentGrades = [];
    for (let i = headerLineIndex; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/\s+/);

        if (!/^\d+$/.test(parts[0])) continue;

        const firstScoreIdx = parts.findIndex((p, idx) => idx > 0 && /^(\d+)(?:-[A-Z0-9]+)?$/.test(p));
        if (firstScoreIdx === -1) continue;

        const studentName = parts.slice(1, firstScoreIdx).join(' ');
        const actualScores = [];
        
        for (let j = firstScoreIdx; j < parts.length; j++) {
            const m = parts[j].match(/^(\d+)(?:-[A-Z0-9]+)?$/);
            if (m) actualScores.push(parseFloat(m[1]));
        }

        if (studentName.length < 3 || actualScores.length < 2) continue;

        // Map scores to subjects (Standard sequence in school PDFs: Maths, Science, SST, English)
        const subjectScores = {
            'maths': actualScores[0],
            'mathematics': actualScores[0],
            'science': actualScores[1],
            'sst': actualScores[2],
            'social studies': actualScores[2],
            'english': actualScores[3]
        };

        studentGrades.push({
            studentName: studentName.trim(),
            scores: subjectScores
        });
    }

    console.log(`Successfully parsed ${studentGrades.length} students.`);
    return studentGrades;
};
