const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');

// @desc    Log time for a task
// @route   POST /api/tasks/:taskId/time
// @access  Authenticated
exports.logTime = async (req, res) => {
    try {
        const { hours, description } = req.body;
        const { taskId } = req.params;

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ msg: 'Task not found' });
        
        const newTimeEntry = new TimeEntry({ 
            hours, 
            description, 
            user: req.userId, 
            task: taskId, 
            project: task.projectId 
        });

        await newTimeEntry.save();
        res.status(201).json(newTimeEntry);
    } catch (err) { 
        res.status(500).send('Server Error'); 
    }
};

// @desc    Log a general time entry
// @route   POST /api/timeentries
// @access  Authenticated
exports.logGeneralTime = async (req, res) => {
    try {
        const { hours, taskId, projectId, description } = req.body;
        if (!hours || !projectId) {
            return res.status(400).json({ msg: 'Please provide hours and a project' });
        }
        const newTimeEntry = new TimeEntry({
            hours,
            description,
            taskId,
            projectId,
            user: req.userId
        });
        const timeEntry = await newTimeEntry.save();
        res.json(timeEntry);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};