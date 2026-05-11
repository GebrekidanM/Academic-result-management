const PDF = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// @desc    Extract marks from uploaded PDF file
// @route   POST /api/pdf/extract-marks
// @access  Private (Admin, Staff)
exports.extractMarksFromPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
        }

        const { subjectId, assessmentTypeId } = req.body;
        if (!subjectId || !assessmentTypeId) {
            return res.status(400).json({ success: false, message: 'Subject ID and Assessment Type ID are required' });
        }

        // Read the uploaded PDF file
        const pdfPath = req.file.path;
        const pdfBuffer = fs.readFileSync(pdfPath);
        
        // Parse the PDF
        const pdfData = await PDF(pdfBuffer);
        
        if (!pdfData || !pdfData.text) {
            return res.status(400).json({ success: false, message: 'Unable to parse PDF file' });
        }

        // Extract marks from PDF text
        const extractedMarks = extractMarksFromPDFText(pdfData.text, subjectId, assessmentTypeId);
        
        if (extractedMarks.length === 0) {
            return res.status(400).json({ success: false, message: 'No marks found in PDF' });
        }

        res.json({
            success: true,
            message: `Successfully extracted ${extractedMarks.length} marks from PDF`,
            marks: extractedMarks,
            totalStudents: extractedMarks.length
        });

    } catch (error) {
        console.error('PDF extraction error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error processing PDF file',
            error: error.message 
        });
    }
};

// Helper function to extract marks from PDF text
function extractMarksFromPDFText(pdfText, subjectId, assessmentTypeId) {
    const lines = pdfText.split('\n');
    const marks = [];
    
    // Look for student name patterns (e.g., "John Doe - 85")
    const studentNamePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*-\s*(\d+))/g;
    
    // Look for score patterns
    const scorePattern = /(\d+)/g;
    
    let currentStudent = null;
    let currentScore = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Check if line contains a student name and score
        const studentMatch = line.match(studentNamePattern);
        const scoreMatch = line.match(scorePattern);
        
        if (studentMatch && scoreMatch) {
            if (currentStudent) {
                // Save the previous student's data
                marks.push({
                    studentName: currentStudent,
                    studentId: generateStudentId(currentStudent),
                    score: currentScore,
                    subjectId: subjectId,
                    assessmentTypeId: assessmentTypeId
                });
            }
            
            currentStudent = studentMatch[1];
            currentScore = parseInt(scoreMatch[1]);
        }
    }
    
    // Don't forget the last student
    if (currentStudent && currentScore !== null) {
        marks.push({
            studentName: currentStudent,
            studentId: generateStudentId(currentStudent),
            score: currentScore,
            subjectId: subjectId,
            assessmentTypeId: assessmentTypeId
        });
    }
    
    return marks;
}

// Helper function to generate student ID from name
function generateStudentId(studentName) {
    return studentName.toLowerCase().replace(/\s+/g, '-');
}

// @desc    Get PDF marks extraction history
// @route   GET /api/pdf/marks-history
// @access  Private (Admin, Staff)
exports.getPDFMarksHistory = async (req, res) => {
    try {
        // This would typically fetch from a database
        // For now, return mock data
        const mockHistory = [
            {
                id: 1,
                fileName: 'class4_marks.pdf',
                subjectName: 'Mathematics',
                assessmentTypeName: 'Mid Term',
                extractedAt: new Date().toISOString(),
                marksCount: 25,
                status: 'completed'
            },
            {
                id: 2,
                fileName: 'class5_english.pdf',
                subjectName: 'English',
                assessmentTypeName: 'End of Term',
                extractedAt: new Date().toISOString(),
                marksCount: 30,
                status: 'completed'
            }
        ];
        
        res.json({
            success: true,
            history: mockHistory
        });
        
    } catch (error) {
        console.error('Error fetching PDF marks history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching PDF marks history',
            error: error.message 
        });
    }
};
