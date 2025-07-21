const express = require('express');
const router = express.Router();
// THE FIX: Destructure the import to get the specific middleware function
const { authMiddleware } = require('../middleware/authMiddleware');
const Task = require('../models/Task');
const Project = require('../models/Project'); // Needed for some checks

// @route   GET api/tasks
// @desc    Get all tasks, populated with project and user info
// @access  Private
// Use the correctly imported 'authMiddleware' function here
router.get('/', authMiddleware, async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('projectId', 'title')
            .populate('assignedTo', 'name email');
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    const { title, description, status, projectId, assignedTo } = req.body;
    try {
        const newTask = new Task({
            title,
            description,
            status,
            projectId,
            assignedTo,
            // Assuming authMiddleware adds a userId to the request
            createdBy: req.userId 
        });
        const task = await newTask.save();
        const populatedTask = await Task.findById(task._id)
            .populate('projectId', 'title')
            .populate('assignedTo', 'name email');
        res.json(populatedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
    const { title, description, status, projectId, assignedTo } = req.body;

    const taskFields = {};
    if (title) taskFields.title = title;
    if (description !== undefined) taskFields.description = description;
    if (status) taskFields.status = status;
    if (projectId) taskFields.projectId = projectId;
    if (assignedTo) taskFields.assignedTo = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    try {
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        task = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: taskFields },
            { new: true }
        ).populate('projectId', 'title').populate('assignedTo', 'name email');

        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        await Task.findByIdAndRemove(req.params.id);

        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;