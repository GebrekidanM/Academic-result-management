const Notification = require('../models/Notification');
const User = require('../models/User');
const Student = require('../models/Student');
const webpush = require('web-push');

// Configure Web Push (Reuse your env vars)
webpush.setVapidDetails(
    process.env.MAILTO || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * Sends a notification internally from other controllers
 * @param {string} title - Title of notification
 * @param {string} message - Body text
 * @param {Array} targetRoles - ['parent', 'admin', 'staff']
 * @param {string} targetGrade - Specific grade or 'All'
 * @param {string} senderId - ID of the user triggering the event
 */
const sendSystemNotification = async (title, message, targetRoles, targetGrade, senderId) => {
    try {
        // 1. Save to Database
        await Notification.create({
            title,
            message,
            targetRoles,
            targetGrade: targetGrade || 'All',
            createdBy: senderId
        });

        // 2. Prepare Push Payload
        const payload = JSON.stringify({
            title: title,
            body: message,
            icon: '/er-192.png',
            url: '/' 
        });

        let usersToNotify = [];

        // 3. Find Staff/Admins
        if (targetRoles.some(r => ['admin', 'teacher', 'staff'].includes(r))) {
            const staff = await User.find({
                role: { $in: targetRoles },
                pushSubscription: { $exists: true }
            });
            usersToNotify = [...usersToNotify, ...staff];
        }

        // 4. Find Parents (Students)
        if (targetRoles.includes('parent')) {
            let parentQuery = { pushSubscription: { $exists: true } };
            
            // Filter by Grade if specified
            if (targetGrade && targetGrade !== 'All') {
                // Regex to match "Grade 4" with "Grade 4A", "Grade 4B" etc.
                // We assume targetGrade passed is simple like "Grade 4"
                parentQuery.gradeLevel = { $regex: new RegExp(`^${targetGrade}`, 'i') };
            }

            const parents = await Student.find(parentQuery);
            usersToNotify = [...usersToNotify, ...parents];
        }

        // 5. Send Pushes
        usersToNotify.forEach(user => {
            if (user.pushSubscription) {
                webpush.sendNotification(user.pushSubscription, payload)
                    .catch(err => {
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            // Clean up dead subscriptions
                            if (user.role) User.updateOne({ _id: user._id }, { $unset: { pushSubscription: 1 } }).exec();
                            else Student.updateOne({ _id: user._id }, { $unset: { pushSubscription: 1 } }).exec();
                        }
                    });
            }
        });

        console.log(`🔔 System Notification Sent: "${title}" to ${usersToNotify.length} devices.`);

    } catch (error) {
        console.error("System Notification Failed:", error);
        // We do NOT throw error here, so the main action (Upload/Grade) doesn't fail just because notification failed.
    }
};

module.exports = sendSystemNotification;