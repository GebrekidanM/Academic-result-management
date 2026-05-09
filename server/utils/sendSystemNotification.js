const Notification = require('../models/Notification');
const User = require('../models/User');
const Student = require('../models/Student');
const webpush = require('web-push');

// Configure Web Push only when VAPID keys exist.
const hasVapidKeys = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (hasVapidKeys) {
    webpush.setVapidDetails(
        process.env.MAILTO || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn('Web-push disabled: VAPID keys are missing.');
}

/**
 * Sends a notification internally from other controllers
 * @param {string} title - Title of notification
 * @param {string} message - Body text
 * @param {Array} targetRoles - ['parent', 'admin', 'staff']
 * @param {string} targetClassId - Specific class ID or null
 * @param {string} senderId - ID of the user triggering the event
 * @param {string} targetStreamId - Optional stream ID
 */
const sendSystemNotification = async (title, message, targetRoles, targetClassId, senderId, targetStreamId = null) => {
    try {
        // 1. Save to Database
        await Notification.create({
            title,
            message,
            targetRoles,
            targetClass: targetClassId || null,
            targetStream: targetStreamId || null,
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
            
            // Filter by Class if specified
            if (targetClassId) {
                parentQuery.class = targetClassId;
            }
            if (targetStreamId) {
                parentQuery.stream = targetStreamId;
            }

            const parents = await Student.find(parentQuery);
            usersToNotify = [...usersToNotify, ...parents];
        }

        // 5. Send Pushes (skip when VAPID keys are not configured)
        if (hasVapidKeys) {
            usersToNotify.forEach(user => {
                if (user.pushSubscription) {
                    webpush.sendNotification(user.pushSubscription, payload)
                        .catch(err => {
                            if (err.statusCode === 410 || err.statusCode === 404) {
                                // Clean up dead subscriptions
                                if (user && user.role) User.updateOne({ _id: user._id }, { $unset: { pushSubscription: 1 } }).exec();
                                else if (user) Student.updateOne({ _id: user._id }, { $unset: { pushSubscription: 1 } }).exec();
                            }
                        });
                }
            });
        }

        console.log(`🔔 System Notification Sent: "${title}" to ${usersToNotify.length} devices.`);

    } catch (error) {
        console.error("System Notification Failed:", error);
        // We do NOT throw error here, so the main action (Upload/Grade) doesn't fail just because notification failed.
    }
};

module.exports = sendSystemNotification;