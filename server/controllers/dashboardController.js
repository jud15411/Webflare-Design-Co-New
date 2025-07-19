const Project = require('../models/Project');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const TimeEntry = require('../models/TimeEntry');
const mongoose = require('mongoose');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Authenticated
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            activeProjects,
            pendingTasks,
            unpaidInvoicesResult,
            recentProjects,
            timeEntriesToday
        ] = await Promise.all([
            Project.countDocuments({ status: { $nin: ['Completed', 'Cancelled'] } }),
            Task.countDocuments({ assignedTo: req.userId, status: { $ne: 'Done' } }),
            Invoice.aggregate([{ $match: { status: { $ne: 'Paid' } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Project.find().sort({ createdAt: -1 }).limit(5).populate('clientId', 'name'),
            TimeEntry.aggregate([
                { $match: { user: new mongoose.Types.ObjectId(req.userId), createdAt: { $gte: today } } },
                { $group: { _id: null, total: { $sum: '$hours' } } }
            ])
        ]);

        const invoicesDue = unpaidInvoicesResult.length > 0 ? unpaidInvoicesResult[0].total : 0;
        const hoursToday = timeEntriesToday.length > 0 ? timeEntriesToday[0].total : 0;
        res.json({ activeProjects, pendingTasks, invoicesDue, recentProjects, hoursToday });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};