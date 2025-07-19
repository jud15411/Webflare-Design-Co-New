const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const timeEntryController = require('../controllers/timeEntryController');
const { authMiddleware, adminOnlyMiddleware, ceoOnlyMiddleware } = require('../middleware/authMiddleware');

// Get all tasks, Create a new task
router.route('/')
    .get(authMiddleware, taskController.getTasks)
    .post(authMiddleware, adminOnlyMiddleware, taskController.createTask);

// Update a task, Delete a task
router.route('/:id')
    .put(authMiddleware, adminOnlyMiddleware, taskController.updateTask)
    .delete(authMiddleware, ceoOnlyMiddleware, taskController.deleteTask);

// Update just the status of a task
router.put('/:id/status', authMiddleware, taskController.updateTaskStatus);

// Log time for a task
router.post('/:taskId/time', authMiddleware, timeEntryController.logTime);

module.exports = router;