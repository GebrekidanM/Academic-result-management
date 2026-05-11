require('dotenv').config();
const { parseGradesPdf } = require('./utils/pdfParser');
const fs = require('fs');

const run = async () => {
    const buffer = fs.readFileSync('C:\\Users\\NILE\\Downloads\\4.pdf');
    const results = await parseGradesPdf(buffer);
    console.log(`\nTotal students parsed: ${results.length}`);
    results.forEach(r => {
        console.log(`  ${r.studentName}: ${JSON.stringify(r.scores)}`);
    });
};

run().catch(e => console.error(e.message));
