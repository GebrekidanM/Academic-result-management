const Grade = require('../models/Grade');
const Student = require('../models/Student');

// --- Helper: Check if Grade is KG ---
const isKindergarten = (gradeLevel) => {
    if (!gradeLevel) return false;
    return /^(kg|nursery|pre)/i.test(gradeLevel);
};

// --- Helper: Calculate Rank with Tie-Breaking ---
const findRankInList = (sortedList, targetStudentId, scoreField) => {
    let rank = 0;

    for (let i = 0; i < sortedList.length; i++) {
        if (i === 0 || sortedList[i][scoreField] < sortedList[i - 1][scoreField]) {
            rank = i + 1;
        }

        if (sortedList[i]._id.toString() === targetStudentId) {
            return `${rank} / ${sortedList.length}`;
        }
    }
    return '-';
};

// 1. SEMESTER RANK (Based on Total Score)
exports.getSemesterRank = async (req, res) => {
    const { studentId } = req.params;
    const { academicYear, semester, gradeLevel } = req.query;

    if (!academicYear || !semester || !gradeLevel) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    if (isKindergarten(gradeLevel)) return res.status(200).json({ rank: '-' });

    try {
        const rankedList = await Grade.aggregate([
            // ⚠️ ማስተካከያ 1፦ መጀመሪያ በ Grade ላይ ፊልተር ማድረግ (እጅግ በጣም ፈጣን ያደርገዋል) [1]
            {
                $match: {
                    academicYear: academicYear,
                    semester: semester
                }
            },
            // ⚠️ ጆይኑ የሚሰራው ፊልተር ከተደረጉት ጥቂት መቶ ሰነዶች ጋር ብቻ ነው [1]
            { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
            { $unwind: '$studentInfo' },
            {
                $match: {
                    'studentInfo.gradeLevel': gradeLevel,
                    'studentInfo.status': 'Active'
                }
            },
            {
                $group: {
                    _id: '$student', 
                    totalScore: { $sum: '$finalScore' } 
                }
            },
            { $sort: { totalScore: -1 } }
        ]);

        const rankStr = findRankInList(rankedList, studentId, 'totalScore');
        res.status(200).json({ rank: rankStr });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 2. OVERALL RANK (Based on Average)
exports.getOverallRank = async (req, res) => {
    const { studentId } = req.params;
    const { academicYear, gradeLevel } = req.query;

    if (!academicYear || !gradeLevel) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    if (isKindergarten(gradeLevel)) return res.status(200).json({ rank: '-' });

    try {
        const rankedList = await Grade.aggregate([
            // ⚠️ ማስተካከያ 2፦ መጀመሪያ በ Grade ላይ ፊልተር ማድረግ (እጅግ በጣም ፈጣን ያደርገዋል) [1]
            {
                $match: {
                    academicYear: academicYear
                }
            },
            { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
            { $unwind: '$studentInfo' },
            {
                $match: {
                    'studentInfo.gradeLevel': gradeLevel,
                    'studentInfo.status': 'Active'
                }
            },
            {
                $group: {
                    _id: '$student', 
                    overallAverage: { $avg: '$finalScore' } 
                }
            },
            { $sort: { overallAverage: -1 } }
        ]);

        const rankStr = findRankInList(rankedList, studentId, 'overallAverage');
        res.status(200).json({ rank: rankStr });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get ranks for all students in a class at once (Batch Rank)
// @route   GET /api/ranks/class-batch
// @desc    Get all ranks (Sem 1, Sem 2, Overall) for all students in a class at once (Enterprise Batch API)
// @route   GET /api/ranks/class-batch-all
exports.getClassRanksBatchAll = async (req, res) => {
    const { gradeLevel, academicYear } = req.query;

    if (!gradeLevel || !academicYear) {
        return res.status(400).json({ message: 'Grade level and Academic Year are required.' });
    }

    try {
        // ⚠️ 1. የክፍሉን ተማሪዎች በሙሉ መፈለግ
        const students = await Student.find({ gradeLevel, status: 'Active' }).select('_id');
        const studentIds = students.map(s => s._id);

        // ⚠️ 2. የሰሚስተር 1 ደረጃዎችን በጅምላ ማስላት [1]
        const sem1List = await Grade.aggregate([
            { $match: { academicYear, semester: 'First Semester', student: { $in: studentIds } } },
            { $group: { _id: '$student', score: { $sum: '$finalScore' } } },
            { $sort: { score: -1 } }
        ]);

        // ⚠️ 3. የሰሚስተር 2 ደረጃዎችን በጅምላ ማስላት [1]
        const sem2List = await Grade.aggregate([
            { $match: { academicYear, semester: 'Second Semester', student: { $in: studentIds } } },
            { $group: { _id: '$student', score: { $sum: '$finalScore' } } },
            { $sort: { score: -1 } }
        ]);

        // ⚠️ 4. የዓመታዊ (Overall) ደረጃዎችን በጅምላ ማስላት [1]
        const overallList = await Grade.aggregate([
            { $match: { academicYear, student: { $in: studentIds } } },
            { $group: { _id: '$student', score: { $avg: '$finalScore' } } },
            { $sort: { score: -1 } }
        ]);

        // ደረጃዎችን የማዘጋጃ ረዳት ፈንክሽን
        const buildRankMap = (sortedList, scoreField) => {
            const map = {};
            let rank = 0;
            for (let i = 0; i < sortedList.length; i++) {
                if (i === 0 || sortedList[i][scoreField] < sortedList[i - 1][scoreField]) {
                    rank = i + 1;
                }
                map[sortedList[i]._id.toString()] = `${rank} / ${sortedList.length}`;
            }
            return map;
        };

        const sem1Map = buildRankMap(sem1List, 'score');
        const sem2Map = buildRankMap(sem2List, 'score');
        const overallMap = buildRankMap(overallList, 'score');

        // ⚠️ 5. ሁሉንም ደረጃዎች በአንድ ላይ ማዋሃድ (የተማሪ ID ➡️ {sem1, sem2, overall}) [2]
        const finalRanksMap = {};
        studentIds.forEach(id => {
            const idStr = id.toString();
            finalRanksMap[idStr] = {
                sem1: sem1Map[idStr] || '-',
                sem2: sem2Map[idStr] || '-',
                overall: overallMap[idStr] || '-'
            };
        });

        res.status(200).json({ success: true, ranks: finalRanksMap });

    } catch (error) {
        console.error("Batch Rank Controller Error:", error);
        res.status(500).json({ message: 'Server error calculating batch ranks' });
    }
};