const Notification = require('../models/Notification');
const Student = require('../models/Student');
const User = require('../models/User');
const webpush = require('web-push');

// 1. Configure Web Push
// Ensure these are set in your .env file
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.MAILTO || 'mailto:admin@freedomschool.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// @desc    Send a new notification (DB + Push)
// @route   POST /api/notifications
exports.createNotification = async (req, res) => {
    try {
        const { title, message, targetRoles, targetGrade } = req.body;

        // Validation
        if (!title || !message || !targetRoles) {
            return res.status(400).json({ message: "Please fill all fields" });
        }
        
        // --- A. Save to Database (For History/Bell Icon) ---
        const notification = await Notification.create({
            title,
            message,
            targetRoles,
            targetGrade: targetGrade || 'All',
            createdBy: req.user._id
        });

        // --- B. Send Web Push (Background Process) ---
        const sendPush = async () => {
            try {
                // 1. Define Payload
                const payload = JSON.stringify({
                    title: title,
                    body: message,
                    icon: '/er-192.png', // Ensure this image exists in public folder
                    url: '/' // Clicking opens the app
                });

                // 2. Define Options (CRITICAL FOR MOBILE BACKGROUND)
                const options = {
                    TTL: 60 * 60 * 24, // Keep trying for 24 hours if phone is off
                    headers: {
                        'Urgency': 'high' // <--- Wakes up sleeping Android/iOS devices
                    }
                };

                let usersToNotify = [];

                // 3. Find Staff/Admins with subscriptions
                if (targetRoles.some(r => ['admin', 'teacher', 'staff'].includes(r))) {
                    const staff = await User.find({
                        role: { $in: targetRoles },
                        pushSubscription: { $exists: true }
                    });
                    usersToNotify = [...usersToNotify, ...staff];
                }

                // 4. Find Parents (Students) with subscriptions
                if (targetRoles.includes('parent')) {
                    let parentQuery = { pushSubscription: { $exists: true } };
                    
                    // Filter by Grade if specified (and not 'All')
                    if (targetGrade && targetGrade !== 'All') {
                        // Regex to match "Grade 4" with "Grade 4A", "Grade 4B" etc.
                        parentQuery.gradeLevel = { $regex: new RegExp(`^${targetGrade}`, 'i') };
                    }

                    const parents = await Student.find(parentQuery);
                    usersToNotify = [...usersToNotify, ...parents];
                }

                // 5. Send to all found users
                usersToNotify.forEach(user => {
                    if (user.pushSubscription) {
                        webpush.sendNotification(user.pushSubscription, payload, options)
                            .catch(err => {
                                // If subscription is invalid (410 Gone / 404 Not Found), remove it to clean DB
                                if (err.statusCode === 410 || err.statusCode === 404) {
                                    console.log(`Cleaning dead subscription for user: ${user._id}`);
                                    if (user.role) { // It's a Staff User
                                        User.updateOne({ _id: user._id }, { $unset: { pushSubscription: 1 } }).exec();
                                    } else { // It's a Student/Parent
                                        Student.updateOne({ _id: user._id }, { $unset: { pushSubscription: 1 } }).exec();
                                    }
                                } else {
                                    console.error("Push Error:", err.statusCode);
                                }
                            });
                    }
                });

            } catch (pushErr) {
                console.error("Push Notification Logic Error:", pushErr);
                // Do not crash the request if push fails, the DB record is already saved.
            }
        };

        // Fire the push logic (Don't await it to keep API response fast)
        sendPush();

        // --- C. Respond to Client ---
        return res.status(201).json({ success: true, data: notification });

    } catch (error) {
        console.error("Create Notification Error:", error);
        // Only send error if we haven't already responded
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Failed to send notification' });
        }
    }
};

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
exports.getMyNotifications = async (req, res) => {
    try {
        // Handle both User (Staff) and Student (Parent) models
        const currentUser = req.user || req.student; 
        
        if (!currentUser) {
             return res.status(401).json({ message: "Not Authorized" });
        }

        const userRole = currentUser.role || 'parent'; 
        const userId = currentUser._id;
        
        // Default filter: User can see 'All' messages
        let gradeFilters = ['All']; 

        // --- Smart Grade Filtering for Parents ---
        if (userRole === 'parent' || userRole === 'student') {
            const student = await Student.findById(userId);
            
            if (student) {
                const fullGrade = student.gradeLevel; // e.g. "Grade 4A"
                gradeFilters.push(fullGrade); 

                // Add base grade (e.g. "Grade 4") so broad announcements work
                const baseGradeMatch = fullGrade.match(/(Grade\s*\d+|KG\s*\d+|Nursery)/i);
                if (baseGradeMatch) {
                    const baseGrade = baseGradeMatch[0]; 
                    if (baseGrade !== fullGrade) gradeFilters.push(baseGrade);
                }
                
                // Add School Level (Primary/High School)
                if (/^Grade\s*[1-8](\D|$)/i.test(fullGrade)) gradeFilters.push("Primary");
                if (/^Grade\s*(9|1[0-2])(\D|$)/i.test(fullGrade)) gradeFilters.push("High School");
                if (/^(kg|nursery)/i.test(fullGrade)) gradeFilters.push("KG");
            }
        }

        // --- Build Query ---
        const query = {
            targetRoles: { $in: [userRole, 'parent'] }
        };

        // Only apply grade filter for parents. Staff sees all messages for their role.
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

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.deleteOne();
        res.json({ success: true, message: 'Notification removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a notification
// @route   PUT /api/notifications/:id
exports.updateNotification = async (req, res) => {
    try {
        const { title, message } = req.body;
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.title = title || notification.title;
        notification.message = message || notification.message;

        const updatedNotification = await notification.save();
        res.json({ success: true, data: updatedNotification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};