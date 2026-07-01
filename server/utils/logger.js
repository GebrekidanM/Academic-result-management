const AuditLog = require('../models/AuditLog');

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
        console.error("Failed to write audit log:", error.message);
    }
};

module.exports = { logActivity };