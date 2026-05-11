const { PDFParse } = require('pdf-parse');

/**
 * Parses a grades PDF buffer into structured student+score data.
 * Handles the format: "42 KISAKA ABDUL-RAHMAN SSALI 35-P8 40-P7 54-C5 48-C6 177 45 26 3 42 199"
 * where scores have a grade suffix (35-P8) and trailing columns are totals/ranks.
 */
exports.parseGradesPdf = async (buffer) => {
    if (!buffer) throw new Error('No PDF buffer provided.');

    // ── Extract text ──────────────────────────────────────────────────────────
    let extractedText = '';
    try {
        const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        const parser = new PDFParse({ data: uint8, verbosity: 0 });
        const result = await parser.getText();
        extractedText = result.text || result.pages?.map(p => p.text).join('\n') || '';
    } catch (err) {
        throw new Error('Failed to read PDF file: ' + err.message);
    }

    if (!extractedText.trim()) throw new Error('PDF appears to be empty or contains no extractable text.');

    const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    console.log(`PDF parsed. Total lines: ${lines.length}`);

    // ── Subject keyword list ──────────────────────────────────────────────────
    const subjectKeywords = [
        'maths', 'mathematics', 'english', 'science',
        'social studies', 'sst', 'literacy', 'literacy 1', 'literacy 2',
        're', 'religious education', 'local language', 'loc'
    ];

    const normalizeSubject = (str) => {
        const s = str.toLowerCase().trim();
        if (s.includes('math')) return 'mathematics';
        if (s.includes('social') || s === 'sst') return 'social studies';
        if (s.includes('science')) return 'science';
        if (s.includes('english')) return 'english';
        if (s.includes('literacy 1') || s === 'lit1') return 'literacy 1';
        if (s.includes('literacy 2') || s === 'lit2') return 'literacy 2';
        if (s.includes('literacy')) return 'literacy 1';
        if (s.includes('religious') || s === 're') return 'religious education';
        if (s.includes('local') || s === 'loc') return 'local language';
        return s;
    };

    const isSubjectLine = (line) =>
        subjectKeywords.some(k => line.toLowerCase() === k || line.toLowerCase() === k.toUpperCase());

    // ── Strategy 1: Vertical headers (one subject per line) ──────────────────
    // e.g. lines: "MATHS" / "SCIENCE" / "SST" / "ENGLISH"
    let subjectHeaders = [];
    let headerEndIndex = -1;

    for (let i = 0; i < Math.min(lines.length, 100); i++) {
        if (isSubjectLine(lines[i])) {
            // Collect consecutive subject lines
            const run = [];
            let j = i;
            while (j < lines.length && (isSubjectLine(lines[j]) || lines[j].toUpperCase() === lines[j] && lines[j].length < 30)) {
                if (isSubjectLine(lines[j])) run.push(normalizeSubject(lines[j]));
                j++;
            }
            if (run.length >= 2) {
                subjectHeaders = run;
                headerEndIndex = j - 1;
                break;
            }
        }
    }

    // ── Strategy 2: Horizontal header line with 2+ subjects ──────────────────
    if (subjectHeaders.length === 0) {
        for (let i = 0; i < Math.min(lines.length, 80); i++) {
            const lower = lines[i].toLowerCase();
            const found = subjectKeywords.filter(k => lower.includes(k));
            if (found.length >= 2) {
                headerEndIndex = i;
                const tokens = lines[i].split(/\s{2,}|\t/).map(t => t.trim()).filter(Boolean);
                subjectHeaders = tokens
                    .filter(t => subjectKeywords.some(k => t.toLowerCase().includes(k)))
                    .map(normalizeSubject);
                break;
            }
        }
    }

    console.log(`Header ends at line ${headerEndIndex}. Subjects: [${subjectHeaders.join(', ')}]`);

    // ── Parse student rows ────────────────────────────────────────────────────
    // Row format: "<seq#> <NAME WORDS> <score1>-<GRADE> <score2>-<GRADE> ... <total> <avg> ..."
    // Key insight: subject scores have format \d+-[A-Z0-9]+ (e.g. 35-P8, 54-C5)
    // Plain numbers after scores are totals/ranks — ignore them.
    // Scores with "-" like "35-P8" are the ONLY subject scores.
    // A "-" alone means absent/missing.

    const studentGrades = [];
    const startRow = headerEndIndex === -1 ? 0 : headerEndIndex + 1;

    // Score token: digits followed by hyphen and grade code, OR standalone "-" (absent)
    const scoreTokenRe = /^(\d+)-[A-Z0-9]+$|^-$/;

    for (let i = startRow; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/\s+/);

        // Must start with a sequence number
        if (!/^\d+$/.test(parts[0])) continue;

        // Find where score tokens start (first token matching score pattern after index 0)
        let firstScoreIdx = -1;
        for (let k = 1; k < parts.length; k++) {
            if (scoreTokenRe.test(parts[k])) {
                firstScoreIdx = k;
                break;
            }
        }
        if (firstScoreIdx === -1) continue;

        // Student name = everything between seq# and first score token
        const studentName = parts.slice(1, firstScoreIdx).join(' ').trim();
        if (studentName.length < 2) continue;

        // Skip if name is a subject keyword (false row)
        if (subjectKeywords.some(k => studentName.toLowerCase() === k)) continue;

        // Collect ONLY score tokens (stop at first plain number = total score)
        const scores = [];
        for (let k = firstScoreIdx; k < parts.length; k++) {
            if (/^(\d+)-[A-Z0-9]+$/.test(parts[k])) {
                // Extract the numeric part only
                scores.push(parseInt(parts[k].split('-')[0], 10));
            } else if (parts[k] === '-') {
                // Absent — push null as placeholder to keep column alignment
                scores.push(null);
            } else {
                // First plain number = total score column → stop
                break;
            }
        }

        if (scores.length === 0) continue;

        // Map scores to subjects using header order
        const subjectScores = {};
        const headersToUse = subjectHeaders.length > 0
            ? subjectHeaders
            : ['mathematics', 'science', 'social studies', 'english']; // P4-P7 fallback

        headersToUse.forEach((subj, idx) => {
            const val = scores[idx];
            if (val !== null && val !== undefined) {
                subjectScores[subj] = val;
                // Add aliases
                if (subj === 'mathematics') subjectScores['maths'] = val;
                if (subj === 'social studies') subjectScores['sst'] = val;
                if (subj === 'religious education') subjectScores['re'] = val;
                if (subj === 'local language') subjectScores['loc'] = val;
                if (subj === 'literacy 1') subjectScores['lit1'] = val;
                if (subj === 'literacy 2') subjectScores['lit2'] = val;
            }
        });

        if (Object.keys(subjectScores).length === 0) continue;

        studentGrades.push({ studentName, scores: subjectScores });
    }

    console.log(`Parsed ${studentGrades.length} students.`);
    if (studentGrades.length > 0) {
        console.log('Sample row 1:', JSON.stringify(studentGrades[0]));
    }
    if (studentGrades.length > 1) {
        console.log('Sample row 2:', JSON.stringify(studentGrades[1]));
    }

    return studentGrades;
};
