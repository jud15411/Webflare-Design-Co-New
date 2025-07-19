const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');

// @desc    Get time report by project
// @route   GET /api/reports/time-by-project
// @access  Admin
exports.getTimeByProject = async (req, res) => {
    try {
        const report = await TimeEntry.aggregate([
            { $group: { _id: "$project", totalHours: { $sum: "$hours" } } },
            { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'projectDetails' } },
            { $unwind: '$projectDetails' },
            { $project: { _id: 0, projectId: '$_id', projectTitle: '$projectDetails.title', totalHours: 1 } },
            { $sort: { projectTitle: 1 } }
        ]);
        res.json(report);
    } catch (err) { res.status(500).send('Server Error'); }
};

// @desc    Get time report by user and project
// @route   GET /api/reports/time-by-user-project
// @access  Admin
exports.getTimeByUserProject = async (req, res) => {
    try {
        const report = await TimeEntry.aggregate([
            { $group: { _id: { user: "$user", project: "$project" }, totalHours: { $sum: "$hours" } } },
            { $lookup: { from: 'users', localField: '_id.user', foreignField: '_id', as: 'userDetails' } },
            { $lookup: { from: 'projects', localField: '_id.project', foreignField: '_id', as: 'projectDetails' } },
            { $unwind: '$userDetails' },
            { $unwind: '$projectDetails' },
            { $project: { _id: 0, userId: '$_id.user', userName: '$userDetails.name', projectId: '$_id.project', projectTitle: '$projectDetails.title', totalHours: 1 } },
            { $sort: { userName: 1, projectTitle: 1 } }
        ]);
        res.json(report);
    } catch (err) { res.status(500).send('Server Error'); }
};

// @desc    Get task status summary
// @route   GET /api/reports/task-status-summary
// @access  Admin
exports.getTaskStatusSummary = async (req, res) => {
    try {
        const summary = await Task.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { _id: 0, status: '$_id', count: 1 } },
            { $sort: { status: 1 } }
        ]);
        res.json(summary);
    } catch (err) { res.status(500).send('Server Error'); }
};