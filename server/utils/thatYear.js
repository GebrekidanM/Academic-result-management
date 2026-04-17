const getCurrentEthDate = (thatYear) => {
    const now = new Date(thatYear);
    const gcYear = now.getFullYear();
    const gcMonth = now.getMonth() + 1;
    const gcDay = now.getDate();

    let ethYear =
        gcMonth > 9 || (gcMonth === 9 && gcDay >= 11)
            ? gcYear - 7
            : gcYear - 8;
    return ethYear;
};

module.exports = getCurrentEthDate;
