const Project = require('../models/Project');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const TimeEntry = require('../models/TimeEntry');
const mongoose = require('mongoose');

exports.getDashboardStats = async (req, res) => {
  // **CRITICAL FIX:** The entire function is wrapped in a try...catch block.
  try {
    // This ensures that an authenticated user is making the request.
    if (!req.userId) {
      return res.status(401).json({ msg: 'Authorization denied. No user ID.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalProjects,
      revenueResult,
      pendingTasks,
      hoursTodayResult
    ] = await Promise.all([
      Project.countDocuments(),
      Invoice.aggregate([
        { $match: { status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Ensure the user ID is correctly cast for the query
      Task.countDocuments({ assignedTo: new mongoose.Types.ObjectId(req.userId), status: { $ne: 'Done' } }),
      TimeEntry.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.userId), createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$hours' } } }
      ])
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const hoursToday = hoursTodayResult.length > 0 ? hoursTodayResult[0].total : 0;

    // The successful JSON response
    res.json({
      totalProjects,
      totalRevenue,
      pendingTasks,
      hoursToday
    });

  } catch (err) {
    // **THIS IS THE FIX:** If any error occurs above, this block runs.
    // It sends a clean JSON error response instead of letting the server crash.
    console.error('💥 DASHBOARD CONTROLLER ERROR:', err.message);
    res.status(500).json({ msg: 'A server error occurred while fetching dashboard stats.', error: err.message });
  }
};