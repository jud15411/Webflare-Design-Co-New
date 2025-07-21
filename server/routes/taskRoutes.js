const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project'); // Needed for some checks

// @route   GET api/tasks
// @desc    Get all tasks, populated with project and user info
// @access  Private
router.get('/', auth, async (req, res) => {
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
router.post('/', auth, async (req, res) => {
    const { title, description, status, projectId, assignedTo } = req.body;
    try {
        const newTask = new Task({
            title,
            description,
            status,
            projectId,
            assignedTo,
            createdBy: req.user.id
        });
        const task = await newTask.save();
        // Return the populated task so the frontend can use the data
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
router.put('/:id', auth, async (req, res) => {
    const { title, description, status, projectId, assignedTo } = req.body;

    const taskFields = {};
    if (title) taskFields.title = title;
    if (description !== undefined) taskFields.description = description;
    if (status) taskFields.status = status;
    if (projectId) taskFields.projectId = projectId;
    // Handle single or multiple assignees
    if (assignedTo) taskFields.assignedTo = Array.isArray(assignedTo) ? assignedTo : [assignedTo];


    try {
        let task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        // Add authorization here if needed, for example:
        // if (task.createdBy.toString() !== req.user.id) {
        //     return res.status(401).json({ msg: 'User not authorized' });
        // }

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
router.delete('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        // Add authorization here if needed (e.g., only CEO or Project Manager can delete)
        // if (req.user.role !== 'CEO' && req.user.role !== 'Project Manager') {
        //    return res.status(401).json({ msg: 'User not authorized to delete tasks' });
        // }

        await Task.findByIdAndRemove(req.params.id);

        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;