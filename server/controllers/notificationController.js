const Notification = require('../models/Notification');

// @desc    Get unread notifications for a user
// @route   GET /api/notifications
// @access  Authenticated
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.userId, isRead: false }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) { res.status(500).send('Server Error'); }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-read
// @access  Authenticated
exports.markNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.userId, isRead: false }, { $set: { isRead: true } });
        res.json({ msg: 'Notifications marked as read' });
    } catch (err) { res.status(500).send('Server Error'); }
};