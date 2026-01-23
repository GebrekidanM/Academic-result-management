const calculateAge = (dob) => {
    if (!dob) return '-';

    const now = new Date();
    const gcYear = now.getFullYear();
    const gcMonth = now.getMonth() + 1;
    const gcDay = now.getDate();

    let currentEthYear = gcYear - 8;

    if (gcMonth > 9 || (gcMonth === 9 && gcDay >= 11)) {
        currentEthYear = gcYear - 7;
    }

    let birthYear;
    
    if (typeof dob === 'string') {
        birthYear = parseInt(dob.split('-')[0], 10);
    } else if (dob instanceof Date) {
        birthYear = dob.getFullYear();
    } else if (typeof dob === 'number') {
        birthYear = dob;
    } else {
        return '-';
    }

    if (isNaN(birthYear)) return '-';
    
    const age = currentEthYear - birthYear;
    
    return age >= 0 ? age : '-';
};

module.exports = calculateAge;