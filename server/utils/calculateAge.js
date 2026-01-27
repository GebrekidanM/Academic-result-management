const getCurrentEthDate = () => {
    const now = new Date();
    const gcYear = now.getFullYear();
    const gcMonth = now.getMonth() + 1;
    const gcDay = now.getDate();

    let ethYear =
        gcMonth > 9 || (gcMonth === 9 && gcDay >= 11)
            ? gcYear - 7
            : gcYear - 8;

    // Approx Ethiopian month/day (good enough for age logic)
    let ethMonth = gcMonth - 8;
    let ethDay = gcDay;

    if (ethMonth <= 0) ethMonth += 12;

    return { ethYear, ethMonth, ethDay };
};

const calculateAge = (dob) => {
    if (!dob) return '-';

    let birthYear, birthMonth, birthDay;

    // CASE 1: dob is a string "YYYY-MM-DD" (E.C)
    if (typeof dob === 'string') {
        const parts = dob.split('-').map(Number);
        if (parts.length !== 3) return '-';
        [birthYear, birthMonth, birthDay] = parts;
    }

    // CASE 2: dob is a Date object (from MongoDB)
    else if (dob instanceof Date) {
        // ⚠️ Assumes the stored date is already Ethiopian-equivalent
        birthYear = dob.getFullYear();
        birthMonth = dob.getMonth() + 1;
        birthDay = dob.getDate();
    }

    // CASE 3: unknown format
    else {
        return '-';
    }

    if (!birthYear || !birthMonth || !birthDay) return '-';

    // ---- Current Ethiopian date ----
    const now = new Date();
    const gcYear = now.getFullYear();
    const gcMonth = now.getMonth() + 1;
    const gcDay = now.getDate();

    const ethYear =
        gcMonth > 9 || (gcMonth === 9 && gcDay >= 11)
            ? gcYear - 7
            : gcYear - 8;

    let ethMonth = gcMonth - 8;
    if (ethMonth <= 0) ethMonth += 12;

    const ethDay = gcDay;

    // ---- Age logic ----
    let age = ethYear - birthYear;

    if (
        ethMonth < birthMonth ||
        (ethMonth === birthMonth && ethDay < birthDay)
    ) {
        age--;
    }

    return age >= 0 ? age : '-';
};


module.exports = calculateAge;