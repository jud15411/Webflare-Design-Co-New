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
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            totalProjects, // STAT 1: Total number of all projects
            revenueResult,   // STAT 2: Total revenue from 'Paid' invoices
            pendingTasks,    // STAT 3: Pending tasks for the logged-in user
            hoursTodayResult // STAT 4: Hours logged today by the user
        ] = await Promise.all([
            Project.countDocuments(), // Gets the count of all documents in the Project collection
            
            Invoice.aggregate([      // Calculates the sum of amounts for all 'Paid' invoices
                { $match: { status: 'Paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            
            Task.countDocuments({ assignedTo: req.userId, status: { $ne: 'Done' } }),

            TimeEntry.aggregate([
                { $match: { user: new mongoose.Types.ObjectId(req.userId), createdAt: { $gte: today, $lt: tomorrow } } },
                { $group: { _id: null, total: { $sum: '$hours' } } }
            ])
        ]);

        // Process the results from the aggregation queries
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
        const hoursToday = hoursTodayResult.length > 0 ? hoursTodayResult[0].total : 0;
        
        // Send all stats in the JSON response
        res.json({
            totalProjects,
            totalRevenue,
            pendingTasks,
            hoursToday
        });

    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).send('Server Error');
    }
};