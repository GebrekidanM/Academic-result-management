const Notification = require('../models/Notification');
const Student = require('../models/Student');
const User = require('../models/User');
const webpush = require('web-push');

// Configure Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.MAILTO || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// @desc    Send a new notification
// @route   POST /api/notifications
exports.createNotification = async (req, res) => {
    try {
        const { title, message, targetRoles, targetGrade } = req.body;

        // 1. Validation
        if (!title || !message || !targetRoles) {
            return res.status(400).json({ message: "Please fill all fields" });
        }
        
        // 2. Save to Database
        const notification = await Notification.create({
            title,
            message,
            targetRoles,
            targetGrade: targetGrade || 'All',
            createdBy: req.user._id
        });

        // 3. Send Push Notifications (Fire and Forget)
        // We do NOT await this part to block the response, but we handle errors internally.
        const sendPush = async () => {
            try {
                const payload = JSON.stringify({
                    title: title,
                    body: message,
                    icon: '/er-192.png',
                    url: '/'
                });

                let usersToNotify = [];

                // Find Staff
                if (targetRoles.some(r => ['admin', 'teacher', 'staff'].includes(r))) {
                    const staff = await User.find({
                        role: { $in: targetRoles },
                        pushSubscription: { $exists: true }
                    });
                    usersToNotify = [...usersToNotify, ...staff];
                }

                // Find Parents (Students)
                if (targetRoles.includes('parent')) {
                    let parentQuery = { pushSubscription: { $exists: true } };
                    if (targetGrade && targetGrade !== 'All') {
                        parentQuery.gradeLevel = targetGrade;
                    }
                    const parents = await Student.find(parentQuery);
                    usersToNotify = [...usersToNotify, ...parents];
                }

                // Send to all found users
                usersToNotify.forEach(user => {
                    if (user.pushSubscription) {
                        webpush.sendNotification(user.pushSubscription, payload)
                            .catch(err => {
                                // If subscription is invalid (410/404), remove it
                                if (err.statusCode === 410 || err.statusCode === 404) {
                                    if (user.role) { // It's a User
                                        User.updateOne({ _id: user._id }, { $unset: { pushSubscription: 1 } }).exec();
                                    } else { // It's a Student
                                        Student.updateOne({ _id: user._id }, { $unset: { pushSubscription: 1 } }).exec();
                                    }
                                }
                            });
                    }
                });
            } catch (pushErr) {
                console.error("Push Notification Error (Background):", pushErr);
                // Do NOT send res.json here, headers are already sent
            }
        };

        // Trigger push logic in background
        sendPush();

        // 4. Send Success Response (ONLY ONCE)
        return res.status(201).json({ success: true, data: notification });

    } catch (error) {
        console.error("Create Notification Error:", error);
        // Safety check: Only send error if we haven't replied yet
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Failed to send notification' });
        }
    }
};

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
exports.getMyNotifications = async (req, res) => {
    try {
        const currentUser = req.user || req.student; 
        
        // Safety Check: If middleware failed to attach user
        if (!currentUser) {
             return res.status(401).json({ message: "Not Authorized" });
        }

        const userRole = currentUser.role || 'parent'; 
        const userId = currentUser._id;
        let gradeFilters = ['All']; 

        if (userRole === 'parent' || userRole === 'student') {
            const student = await Student.findById(userId);
            if (student) {
                const fullGrade = student.gradeLevel;
                gradeFilters.push(fullGrade);
                const baseGradeMatch = fullGrade.match(/(Grade\s*\d+|KG\s*\d+|Nursery)/i);
                if (baseGradeMatch) {
                    gradeFilters.push(baseGradeMatch[0]);
                }
                if (/^Grade\s*[1-8](\D|$)/i.test(fullGrade)) gradeFilters.push("Primary");
                if (/^Grade\s*(9|1[0-2])(\D|$)/i.test(fullGrade)) gradeFilters.push("High School");
                if (/^(kg|nursery)/i.test(fullGrade)) gradeFilters.push("KG");
            }
        }

        const query = {
            targetRoles: { $in: [userRole, 'parent'] }
        };

        if (userRole === 'parent' || userRole === 'student') {
            query.targetGrade = { $in: gradeFilters };
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(20);

        return res.json({ success: true, data: notifications });

    } catch (error) {
        console.error("Get Notification Error:", error);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Server Error' });
        }
    }
};