const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const TimeEntry = require('../models/TimeEntry');

// @desc    Get tasks (all for admin, assigned for others)
exports.getTasks = async (req, res) => {
    try {
        const userRole = req.userRole ? req.userRole.trim().toUpperCase() : '';
        const query = ['CEO', 'CTO', 'SALES'].includes(userRole) ? {} : { assignedTo: req.userId };
        const tasks = await Task.find(query).populate('projectId', 'title').populate('assignedTo', 'name');
        res.json(tasks);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).send('Server Error');
    }
};

// @desc    Create a task
exports.createTask = async (req, res) => {
    try {
        const task = new Task(req.body);
        await task.save();
        if (task.assignedTo) {
            const author = await User.findById(req.userId);
            const project = await Project.findById(task.projectId);
            const message = `${author.name} assigned you a new task: "${task.title}" for project "${project.title}".`;
            new Notification({ recipient: task.assignedTo, message, link: `/tasks` }).save();
        }
        res.status(201).json(task);
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).send('Server Error');
    }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Ensure assignedTo is null if an empty string is passed
        if (updatedData.assignedTo === '') {
            updatedData.assignedTo = null;
        }

        const task = await Task.findByIdAndUpdate(id, updatedData, { new: true });

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.json(task);
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).send('Server error');
    }
};

// @desc    Update task status
exports.updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!task) return res.status(404).json({ msg: 'Task not found' });
        // Handle notifications if needed
        res.json(task);
    } catch (err) {
        console.error('Error updating task status:', err);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a task
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found.' });
        }
        await TimeEntry.deleteMany({ taskId: req.params.id });
        await Task.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Task and associated time entries deleted successfully.' });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ msg: 'Server error while deleting task.' });
    }
};