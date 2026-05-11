const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const AssessmentType = require('../models/AssessmentType');
const GlobalConfig = require('../models/GlobalConfig');
const sendSystemNotification = require('../utils/sendSystemNotification'); 
const { parseGradesPdf } = require('../utils/pdfParser');

// @desc    Get a single grade by ID
// @route   GET /api/grades/:id
exports.getGradeById = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id).populate('subject', 'name');
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    res.status(200).json({ success: true, data: grade });
  } catch (error) {
    console.error("Error fetching grade by ID:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all grades
// @route   GET /api/grades
exports.getGrades = async (req, res) => {
  try {
    const grades = await Grade.find({})
      .populate('student', 'fullName studentId')
      .populate('subject', 'name');
    res.status(200).json({ success: true, count: grades.length, data: grades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload grades from PDF
// @route   POST /api/grades/upload-pdf
exports.uploadPdfGrades = async (req, res) => {
    try {
        const { classId, streamId, testPeriod } = req.body; 
        if (!req.file) return res.status(400).json({ message: "Please upload a PDF file." });

        const config = await GlobalConfig.findOne();
        if (!config) return res.status(500).json({ message: "Global configuration not found." });
        const { currentSemester, currentAcademicYear } = config;

        // Parse PDF using the improved parser
        const extractedData = await parseGradesPdf(req.file.buffer);
        console.log(`PDF extraction complete. Found ${extractedData.length} student rows.`);

        if (extractedData.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No student data could be extracted from the PDF. Please check the file format.' 
            });
        }

        // Fetch subjects for this class to create a mapping
        const subjects = await Subject.find({ class: classId });
        const subjectMap = {}; 
        subjects.forEach(s => {
            const name = s.name.toLowerCase();
            subjectMap[name] = s._id;
            // Common aliases
            if (name === 'mathematics') subjectMap['maths'] = s._id;
            if (name === 'social studies') subjectMap['sst'] = s._id;
            if (s.code) subjectMap[s.code.toLowerCase()] = s._id;
        });

        // Normalize testPeriod: strip suffixes like "-BOT", "-MT", "-EOT"
        const normalizedPeriod = testPeriod.replace(/\s*[-–]\s*(BOT|MT|EOT)$/i, '').trim();

        // Fetch assessment types for this period
        // semester stored as "Term 1"/"Term 2" but config may say "First Semester" — match flexibly
        const assessmentTypes = await AssessmentType.find({
            class: classId,
            year: { $in: [currentAcademicYear, Number(currentAcademicYear)] },
            name: { $regex: new RegExp(normalizedPeriod.split(' ')[0], 'i') }
        });

        const atMap = {}; // subjectId -> assessmentTypeId
        assessmentTypes.forEach(at => {
            atMap[at.subject.toString()] = at._id;
        });
        console.log(`Found ${assessmentTypes.length} assessment types for period "${testPeriod}", semester "${currentSemester}", year ${currentAcademicYear}`);
        console.log(`Subject map keys:`, Object.keys(subjectMap));
        console.log(`AT map entries:`, assessmentTypes.map(at => ({ name: at.name, subject: at.subject })));

        // Helper: bidirectional word-subset match (handles reversed names, middle names, etc.)
        const nameWordsMatch = (pdfName, dbName) => {
            const pdfWords = pdfName.toLowerCase().split(/\s+/).filter(w => w.length > 1);
            const dbWords = dbName.toLowerCase().split(/\s+/).filter(w => w.length > 1);
            const dbLower = dbName.toLowerCase();
            const pdfLower = pdfName.toLowerCase();
            // All PDF words found in DB name
            if (pdfWords.every(w => dbLower.includes(w))) return true;
            // All DB words found in PDF name (handles extra middle names in DB)
            if (dbWords.every(w => pdfLower.includes(w))) return true;
            // At least 2 words match (handles partial name differences)
            const matchCount = pdfWords.filter(w => dbLower.includes(w)).length;
            return matchCount >= 2 && matchCount >= pdfWords.length - 1;
        };

        // Pre-load all students in the class/stream for fast in-memory matching
        const classStudents = await Student.find({ class: classId, stream: streamId });
        console.log(`Found ${classStudents.length} students in class/stream for matching.`);
        if (classStudents.length > 0) {
            console.log('DB names sample:', classStudents.slice(0, 3).map(s => s.fullName));
        }
        if (extractedData.length > 0) {
            console.log('PDF names sample:', extractedData.slice(0, 3).map(d => d.studentName));
        }

        let successCount = 0;
        let skipCount = 0;
        const skippedNames = [];

        for (const data of extractedData) {
            const pdfName = data.studentName.trim();
            let student = classStudents.find(s => nameWordsMatch(pdfName, s.fullName));

            if (!student) {
                skippedNames.push(pdfName);
                skipCount++;
                continue;
            }

            for (const [subHeader, pdfScore] of Object.entries(data.scores)) {
                const subId = subjectMap[subHeader.toLowerCase()];
                if (!subId) continue;

                const atId = atMap[subId.toString()];
                if (!atId) continue;

                // Get the assessment type to know its totalMarks
                const at = assessmentTypes.find(a => a._id.toString() === atId.toString());

                // Store the score exactly as it appears in the PDF (already out of 100)
                const rawScore = pdfScore;

                let gradeDoc = await Grade.findOne({
                    student: student._id,
                    subject: subId,
                    semester: { $regex: new RegExp(currentSemester.split(' ')[0], 'i') },
                    academicYear: currentAcademicYear
                });

                if (!gradeDoc) {
                    gradeDoc = new Grade({
                        student: student._id,
                        subject: subId,
                        semester: currentSemester,
                        academicYear: currentAcademicYear,
                        assessments: [],
                        finalScore: 0
                    });
                }

                // Update or add the assessment score
                const existingIndex = gradeDoc.assessments.findIndex(
                    a => a.assessmentType.toString() === atId.toString()
                );
                if (existingIndex > -1) {
                    gradeDoc.assessments[existingIndex].score = rawScore;
                } else {
                    gradeDoc.assessments.push({ assessmentType: atId, score: rawScore });
                }

                // finalScore = sum of all assessment scores as stored
                gradeDoc.finalScore = parseFloat(
                    gradeDoc.assessments.reduce((sum, a) => sum + (a.score || 0), 0).toFixed(2)
                );
                await gradeDoc.save();
            }
            successCount++;
        }

        if (skippedNames.length > 0) {
            console.log(`Skipped ${skippedNames.length} unmatched PDF names:`, skippedNames);
        }

        res.status(200).json({
            success: true,
            message: `Processed ${successCount} students. Skipped ${skipCount} students not found in this class/stream.`,
            data: { successCount, skipCount, totalExtracted: extractedData.length }
        });

    } catch (error) {
        console.error("PDF Upload Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get grades for a specific student (Filtered and Merged)
exports.getGradesByStudent = async (req, res) => {
  try {
    const studentId = req.params.id || req.params.studentId;
    const studentObj = await Student.findById(studentId);
    if (!studentObj) return res.status(404).json({ message: "Student not found" });
    
    const rawGrades = await Grade.find({ student: studentId })
      .populate('subject', 'name class')
      .populate('assessments.assessmentType', 'name totalMarks month')
      .lean();

    if (!rawGrades.length) return res.status(200).json({ success: true, count: 0, data: [] });

    const currentClassId = studentObj.class.toString();
    const filteredGrades = rawGrades.filter(g => 
        g.subject && g.subject.class?.toString() === currentClassId
    );

    const gradeMap = new Map();
    filteredGrades.forEach(grade => {
        const cleanAssessments = (grade.assessments || []).filter(a => a.assessmentType != null);
        const key = `${grade.semester}-${grade.subject.name.trim().toLowerCase()}`;

        if (gradeMap.has(key)) {
            const existing = gradeMap.get(key);
            const assessmentMap = new Map();
            existing.assessments.forEach(a => assessmentMap.set(a.assessmentType._id.toString(), a));
            cleanAssessments.forEach(a => {
                const assessId = a.assessmentType._id.toString();
                if (!assessmentMap.has(assessId)) assessmentMap.set(assessId, a);
            });
            existing.assessments = Array.from(assessmentMap.values());
            existing.finalScore = existing.assessments.reduce((sum, a) => sum + (a.score || 0), 0);
        } else {
            grade.assessments = cleanAssessments;
            gradeMap.set(key, grade);
        }
    });

    let processedGrades = Array.from(gradeMap.values());
    processedGrades.sort((a, b) => {
        if (a.semester === b.semester) return a.subject.name.localeCompare(b.subject.name);
        return a.semester.localeCompare(b.semester);
    });

    res.status(200).json({ success: true, count: processedGrades.length, data: processedGrades });
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get grade details
exports.getGradeDetails = async (req, res) => {
  const { studentId, subjectId, semester, academicYear } = req.query;
  try {
    const grade = await Grade.findOne({ student: studentId, subject: subjectId, semester, academicYear })
      .populate('assessments.assessmentType', 'name totalMarks');
    res.json({ success: true, data: grade });
  } catch (error) {
    console.error("Error fetching grade details:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a grade
exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    await grade.deleteOne();
    res.status(200).json({ success: true, message: 'Grade deleted successfully.' });
  } catch (error) {
    console.error("Error deleting grade:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a grade entry
exports.updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });

    const { assessments, semester, academicYear } = req.body;
    if (semester) grade.semester = semester;
    if (academicYear) grade.academicYear = academicYear;
    
    if (assessments) {
        const assessmentTypeIds = assessments.map(a => a.assessmentType);
        const defs = await AssessmentType.find({ _id: { $in: assessmentTypeIds } });
        let finalScore = 0;
        for (const a of assessments) {
            const def = defs.find(d => d._id.equals(a.assessmentType));
            if (!def) continue;
            finalScore += Number(a.score);
        }
        grade.assessments = assessments;
        grade.finalScore = finalScore;
    }
    const updated = await grade.save();
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating grade:", error);
    res.status(500).json({ message: 'Server error updating grade.' });
  }
};

// @desc    Get grade sheet for entry
exports.getGradeSheet = async (req, res) => {
  const { assessmentTypeId, streamId } = req.query;
  try {
    const assessmentType = await AssessmentType.findById(assessmentTypeId);
    if (!assessmentType) return res.status(404).json({ message: 'Assessment Type not found.' });

    // Build student filter — optionally restrict by stream
    const studentFilter = { class: assessmentType.class, status: 'Active' };
    if (streamId) studentFilter.stream = streamId;

    const students = await Student.find(studentFilter).sort({ fullName: 1 });
    const grades = await Grade.find({
      student: { $in: students.map(s => s._id) },
      'assessments.assessmentType': assessmentTypeId
    }).populate('assessments.assessmentType');

    const result = students.map(student => {
      const grade = grades.find(g => g.student.equals(student._id));
      const score = grade?.assessments.find(a => a.assessmentType && a.assessmentType._id.equals(assessmentTypeId))?.score ?? null;
      return { _id: student._id, fullName: student.fullName, score };
    });
    res.status(200).json({ assessmentType, students: result });
  } catch (error) {
    console.error("Error fetching grade sheet:", error);
    res.status(500).json({ message: 'Server error fetching grade sheet.' });
  }
};

// @desc    Save multiple grades (Sheet)
exports.saveGradeSheet = async (req, res) => {
  try {
    const { subjectId, semester, academicYear } = req.body;
    if (req.body.assessmentTypeId && req.body.scores) {
      const { assessmentTypeId, scores } = req.body;
      for (const item of scores) {
        if (item.score === null || item.score === undefined || item.score === '') continue;
        let gradeDoc = await Grade.findOne({ student: item.studentId, subject: subjectId, semester, academicYear });
        if (!gradeDoc) gradeDoc = new Grade({ student: item.studentId, subject: subjectId, semester, academicYear, assessments:[], finalScore: 0 });
        const idx = gradeDoc.assessments.findIndex(a => a.assessmentType.toString() === assessmentTypeId.toString());
        if (idx > -1) gradeDoc.assessments[idx].score = Number(item.score);
        else gradeDoc.assessments.push({ assessmentType: assessmentTypeId, score: Number(item.score) });
        gradeDoc.finalScore = gradeDoc.assessments.reduce((sum, a) => sum + (a.score || 0), 0);
        await gradeDoc.save();
      }
      return res.status(200).json({ success: true, message: "Grades saved successfully" });
    } else if (req.body.studentId && req.body.assessments) {
        const { studentId, assessments } = req.body;
        let gradeDoc = await Grade.findOne({ student: studentId, subject: subjectId, semester, academicYear });
        if (!gradeDoc) gradeDoc = new Grade({ student: studentId, subject: subjectId, semester, academicYear, assessments:[], finalScore: 0 });
        assessments.forEach(update => {
            const idx = gradeDoc.assessments.findIndex(a => a.assessmentType.toString() === update.assessmentType.toString());
            if (idx > -1) gradeDoc.assessments[idx].score = Number(update.score);
            else gradeDoc.assessments.push({ assessmentType: update.assessmentType, score: Number(update.score) });
        });
        gradeDoc.finalScore = gradeDoc.assessments.reduce((sum, a) => sum + (a.score || 0), 0);
        await gradeDoc.save();
        return res.status(200).json({ success: true, message: "Student assessments saved" });
    }
    res.status(400).json({ message: "Invalid payload" });
  } catch (error) {
    res.status(500).json({ message: "Server error saving grades", error: error.message });
  }
};

// @desc    Cleanup broken records
exports.cleanBrokenAssessments = async (req, res) => {
  try {
    const allGrades = await Grade.find().populate('assessments.assessmentType').populate('subject');
    let gradesDeleted = 0;
    let gradesFixed = 0;
    for (const grade of allGrades) {
      if (!grade.subject) {
        await grade.deleteOne(); 
        gradesDeleted++;
        continue;
      }
      const validAssessments = grade.assessments.filter(a => a.assessmentType !== null);
      if (validAssessments.length < grade.assessments.length) {
        grade.assessments = validAssessments;
        grade.finalScore = grade.assessments.reduce((sum, a) => sum + (a.score || 0), 0);
        await grade.save();
        gradesFixed++;
      }
    }
    res.status(200).json({ success: true, message: `Cleaned ${gradesDeleted} deleted subjects and ${gradesFixed} broken assessments.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};