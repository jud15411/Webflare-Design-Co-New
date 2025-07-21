const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create a new time entry
// @route   POST /api/time-entries
exports.createTimeEntry = async (req, res) => {
    try {
        const { taskId, hours, description } = req.body;
        const userId = req.userId;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const newTimeEntry = new TimeEntry({
            userId,
            taskId,
            projectId: task.projectId,
            hours,
            description,
        });

        const timeEntry = await newTimeEntry.save();
        res.status(201).json(timeEntry);

    } catch (err) {
        console.error('Error creating time entry:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all time entries for a specific task
// @route   GET /api/time-entries/task/:taskId
exports.getTimeEntriesForTask = async (req, res) => {
    try {
        const timeEntries = await TimeEntry.find({ taskId: req.params.taskId }).populate('userId', 'name');
        if (!timeEntries) {
            return res.status(404).json({ msg: 'No time entries found for this task' });
        }
        res.json(timeEntries);
    } catch (err) {
        console.error('Error fetching time entries:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update a time entry
// @route   PUT /api/time-entries/:id
exports.updateTimeEntry = async (req, res) => {
    try {
        const { hours, description } = req.body;
        let timeEntry = await TimeEntry.findById(req.params.id);

        if (!timeEntry) {
            return res.status(404).json({ msg: 'Time entry not found' });
        }

        // Check if the user owns the time entry
        if (timeEntry.userId.toString() !== req.userId) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        timeEntry.hours = hours;
        timeEntry.description = description;

        await timeEntry.save();
        res.json(timeEntry);

    } catch (err) {
        console.error('Error updating time entry:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a time entry
// @route   DELETE /api/time-entries/:id
exports.deleteTimeEntry = async (req, res) => {
    try {
        const timeEntry = await TimeEntry.findById(req.params.id);

        if (!timeEntry) {
            return res.status(404).json({ msg: 'Time entry not found' });
        }

        // Check if the user owns the time entry
        if (timeEntry.userId.toString() !== req.userId) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await timeEntry.deleteOne(); // Use deleteOne() for Mongoose v6+
        res.json({ msg: 'Time entry removed' });

    } catch (err) {
        console.error('Error deleting time entry:', err.message);
        res.status(500).send('Server Error');
    }
};