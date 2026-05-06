const xlsx = require('xlsx');
try {
    const workbook = xlsx.readFile('C:\\Users\\NILE\\Downloads\\P.7.S-students-20260506.xlsx');
    const sheet = workbook.Sheets['Students'] || workbook.Sheets[workbook.SheetNames[0]];
    const csv = xlsx.utils.sheet_to_csv(sheet);
    const header = csv.split('\n')[0];
    console.log('Full Headers:', header);
} catch (err) {
    console.log('Error:', err.message);
}
