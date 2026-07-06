const AuditLog = require('../models/AuditLog');

/**
 * ማንኛውንም የስራ እንቅስቃሴ በራስ-ሰር ዳታቤዝ ውስጥ ለመመዝገብ የሚረዳ ፈንክሽን [2]
 * @param {string} userId - ድርጊቱን የፈጸመው ተጠቃሚ ID
 * @param {string} action - የድርጊቱ ርዕስ (ለምሳሌ "Payment Recorded") [2]
 * @param {string} details - የድርጊቱ ዝርዝር መግለጫ [2]
 * @param {object} req - የኤክስፕረስ ሪኩዌስት ኦብጀክት (የIP አድራሻን ለማንበብ) [2]
 */
const logActivity = async (userId, action, details, req = null) => {
    try {
        const ipAddress = req ? req.ip || req.headers['x-forwarded-for'] : 'System';
        
        await AuditLog.create({
            user: userId,
            action,
            details,
            ipAddress
        });
    } catch (error) {
        console.error("❌ Failed to write audit log:", error.message);
    }
};

module.exports = { logActivity };