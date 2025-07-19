const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const TimeEntry = require('../models/TimeEntry');

// @desc    Get tasks (all for admin, assigned for others)
// @route   GET /api/tasks
// @access  Authenticated
exports.getTasks = async (req, res) => {
    try {
        const userRole = req.userRole ? req.userRole.trim().toUpperCase() : '';
        const query = ['CEO', 'CTO'].includes(userRole) ? {} : { assignedTo: req.userId };
        const tasks = await Task.find(query).populate('projectId', 'title').populate('assignedTo', 'name');
        res.json(tasks);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Admin
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
        res.status(500).send('Server Error');
    }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Admin
exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!task) return res.status(404).json({ msg: 'Task not found' });
        res.json(task);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Authenticated
exports.updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        const updater = await User.findById(req.userId);

        // Notify assignee if someone else updates the task
        if (task.assignedTo && task.assignedTo.toString() !== updater._id.toString()) {
            const message = `${updater.name} updated the status of your task "${task.title}" to "${status}".`;
            new Notification({ recipient: task.assignedTo, message, link: `/tasks` }).save();
        }

        // Notify CEO when a task is completed
        if (status === 'Done') {
            const ceo = await User.findOne({ role: 'CEO' });
            if (ceo && ceo._id.toString() !== updater._id.toString()) {
                 const message = `${updater.name} completed the task: "${task.title}".`;
                 new Notification({ recipient: ceo._id, message, link: `/tasks` }).save();
            }
        }
        
        res.json(task);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};