const getGradeFromScore = (score) => {
    if (score >= 90 && score <= 100) return '1';
    if (score >= 80 && score <= 89) return 'D2';
    if (score >= 70 && score <= 79) return 'C3';
    if (score >= 60 && score <= 69) return 'C4';
    if (score >= 50 && score <= 59) return 'C5';
    if (score >= 45 && score <= 49) return 'C6';
    if (score >= 40 && score <= 44) return 'P7';
    if (score >= 35 && score <= 39) return 'P8';
    if (score >= 0 && score <= 34) return 'F9';
    return '-';
};

module.exports = getGradeFromScore;
