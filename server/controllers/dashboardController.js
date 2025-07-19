const Project = require('../models/Project');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const TimeEntry = require('../models/TimeEntry');
const mongoose = require('mongoose');

exports.getDashboardStats = async (req, res) => {
  // **CRITICAL FIX:** Wrap the entire function in a try...catch block.
  // This ensures that if any of the database queries fail, we catch the error
  // and send a proper JSON error response instead of crashing and sending HTML.
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // This ensures req.userId exists, which is crucial for the queries below.
    if (!req.userId) {
        return res.status(401).json({ msg: 'Not authorized, no user ID found.' });
    }

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
      // This query depends on a valid user ID from the auth token.
      Task.countDocuments({ assignedTo: new mongoose.Types.ObjectId(req.userId), status: { $ne: 'Done' } }),
      TimeEntry.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.userId), createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$hours' } } }
      ])
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const hoursToday = hoursTodayResult.length > 0 ? hoursTodayResult[0].total : 0;

    // This is the successful JSON response.
    res.json({
      totalProjects,
      totalRevenue,
      pendingTasks,
      hoursToday
    });

  } catch (err) {
    // This is the JSON error response that will be sent if anything goes wrong.
    console.error('💥 Dashboard Controller Error:', err.message);
    res.status(500).json({ msg: 'Server error while fetching dashboard stats.', error: err.message });
  }
};