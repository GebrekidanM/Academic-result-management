const capitalizeName = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

module.exports = capitalizeName;