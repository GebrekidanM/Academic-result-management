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

    // dob must be "YYYY-MM-DD" in Ethiopian Calendar
    const [birthYear, birthMonth, birthDay] = dob
        .split('-')
        .map(Number);

    if (!birthYear || !birthMonth || !birthDay) return '-';

    const { ethYear, ethMonth, ethDay } = getCurrentEthDate();

    let age = ethYear - birthYear;

    // If birthday has NOT occurred yet this year → subtract 1
    if (
        ethMonth < birthMonth ||
        (ethMonth === birthMonth && ethDay < birthDay)
    ) {
        age--;
    }

    return age >= 0 ? age : '-';
};

module.exports = calculateAge;