const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');

exports.subscribe = async (req, res) => {
    const subscription = req.body;
    try {
        // Store the new subscription for the logged-in user
        await Subscription.create({ user: req.user._id, subscriptionObject: subscription });
        res.status(201).json({ message: 'Subscription saved.' });
    } catch (error) {
        res.status(500).json({ message: 'Could not save subscription.' });
    }
};


exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(10);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications.' });
    }
};

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false }, 
            { $set: { isRead: true } }
        );
        res.status(200).json({ message: 'All notifications marked as read.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};