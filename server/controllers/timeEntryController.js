const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');

// @desc    Log a new time entry for a task
// @route   POST /api/timeentries
exports.createTimeEntry = async (req, res) => {
    try {
        const { hours, taskId, projectId, description } = req.body;
        const userIdFromToken = req.userId; // From authMiddleware

        if (!hours || !taskId || !projectId) {
            return res.status(400).json({ msg: 'Missing required fields: hours, taskId, and projectId.' });
        }
        
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found.' });
        }

        const newTimeEntry = new TimeEntry({
            hours,
            description,
            task: taskId,
            project: projectId,
            // THE FIX: The field in the TimeEntry model is 'userId', not 'user'.
            userId: userIdFromToken
        });

        await newTimeEntry.save();
        res.status(201).json(newTimeEntry);

    } catch (err) {
        console.error('Error creating time entry:', err);
        res.status(500).json({ msg: 'Server error while logging time.' });
    }
};