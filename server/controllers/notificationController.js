const Notification = require('../models/Notification');
const Student = require('../models/Student'); // Needed to filter parent news by grade
const User = require('../models/User'); // Needed to find staff subscriptions
const webpush = require('web-push');

// 1. Configure Web Push with keys from .env
webpush.setVapidDetails(
    process.env.MAILTO,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// @desc    Send a new notification (DB + Push)
// @route   POST /api/notifications
exports.createNotification = async (req, res) => {
    try {
        const { title, message, targetRoles, targetGrade } = req.body;
        
        // --- A. Save to Database (For History/Bell Icon) ---
        const notification = await Notification.create({
            title,
            message,
            targetRoles,
            targetGrade: targetGrade || 'All',
            createdBy: req.user._id
        });

        // --- B. Send Web Push to Subscribed Browsers ---
        const payload = JSON.stringify({
            title: title,
            body: message,
            icon: '/er-192.png', // Path to your logo in public folder
            url: '/' // Where to go when clicked
        });

        // 1. Find Staff/Admins with subscriptions
        let usersToNotify = [];
        
        if (targetRoles.includes('admin') || targetRoles.includes('teacher') || targetRoles.includes('staff')) {
            const staff = await User.find({
                role: { $in: targetRoles },
                pushSubscription: { $exists: true }
            });
            usersToNotify = [...usersToNotify, ...staff];
        }

        // 2. Find Parents (Students) with subscriptions
        if (targetRoles.includes('parent')) {
            let parentQuery = { pushSubscription: { $exists: true } };
            
            // Filter by Grade if specified
            if (targetGrade && targetGrade !== 'All') {
                parentQuery.gradeLevel = targetGrade;
            }

            const parents = await Student.find(parentQuery);
            usersToNotify = [...usersToNotify, ...parents];
        }

        // 3. Send Pushes in Parallel
        const pushPromises = usersToNotify.map(user => {
            return webpush.sendNotification(user.pushSubscription, payload)
                .catch(err => {
                    console.error(`Push failed for ${user._id}:`, err.statusCode);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription is gone (user cleared data), remove it from DB
                        user.pushSubscription = undefined;
                        user.save();
                    }
                });
        });

        // We don't await the push results to keep the API response fast
        Promise.all(pushPromises);

        res.status(201).json({ success: true, data: notification });

    } catch (error) {
        console.error("Create Notification Error:", error);
        res.status(500).json({ message: 'Failed to send notification' });
    }
};

// @desc    Get notifications for the logged-in user (History)
// @route   GET /api/notifications
exports.getMyNotifications = async (req, res) => {
    try {
        // Handle both User (Staff) and Student (Parent) models
        const currentUser = req.user || req.student; 
        const userRole = currentUser.role || 'parent'; // Students act as parents here
        const userId = currentUser._id;

        let gradeFilters = ['All']; 

        // --- Smart Grade Filtering for Parents ---
        if (userRole === 'parent' || userRole === 'student') {
            const student = await Student.findById(userId);
            
            if (student) {
                const fullGrade = student.gradeLevel; // e.g. "Grade 4A"
                gradeFilters.push(fullGrade); 

                // Add base grade (e.g. "Grade 4")
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
            targetRoles: { $in: [userRole, 'parent'] }, // Include generic parent role
            
            // Only apply grade filter for parents. Staff sees all messages for their role.
            ...( (userRole === 'parent' || userRole === 'student') && { 
                targetGrade: { $in: gradeFilters } 
            })
        };

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ success: true, data: notifications });

    } catch (error) {
        console.error("Get Notification Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};