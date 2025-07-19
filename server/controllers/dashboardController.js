const Project = require('../models/Project');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const TimeEntry = require('../models/TimeEntry');
const mongoose = require('mongoose');

exports.getDashboardStats = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ msg: 'Authorization denied.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all dashboard data in parallel for better performance
    const [
      totalProjects,
      revenueResult,
      pendingTasks,
      hoursTodayResult,
      recentProjects, // New data point
      myTasks         // New data point
    ] = await Promise.all([
      Project.countDocuments(),
      Invoice.aggregate([
        { $match: { status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Task.countDocuments({ assignedTo: new mongoose.Types.ObjectId(req.userId), status: { $ne: 'Done' } }),
      TimeEntry.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.userId), createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$hours' } } }
      ]),
      // Fetch the 5 most recent projects, populating the client's name
      Project.find().sort({ createdAt: -1 }).limit(5).populate('clientId', 'name'),
      // Fetch the 5 most recent tasks assigned to the user
      Task.find({ assignedTo: new mongoose.Types.ObjectId(req.userId) }).sort({ createdAt: -1 }).limit(5).populate('projectId', 'title')
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const hoursToday = hoursTodayResult.length > 0 ? hoursTodayResult[0].total : 0;

    // Send all data in a single, structured response
    res.json({
      stats: {
        totalProjects,
        totalRevenue,
        pendingTasks,
        hoursToday
      },
      recentProjects,
      myTasks
    });

  } catch (err) {
    console.error('💥 DASHBOARD CONTROLLER ERROR:', err.message);
    res.status(500).json({ msg: 'Server error while fetching dashboard stats.' });
  }
};