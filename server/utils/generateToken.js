const jwt = require('jsonwebtoken');

// The type parameter is essential.
const generateToken = (id, type = 'user') => { 
    return jwt.sign({ id, type }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = generateToken;