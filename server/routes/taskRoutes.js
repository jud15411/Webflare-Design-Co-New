const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const timeEntryController = require('../controllers/timeEntryController');
const { authMiddleware, adminOnlyMiddleware, ceoOnlyMiddleware } = require('../middleware/authMiddleware');

router.route('/')
    .get(authMiddleware, taskController.getTasks)
    .post(authMiddleware, adminOnlyMiddleware, taskController.createTask);

router.route('/:id')
    .put(authMiddleware, adminOnlyMiddleware, taskController.updateTask)
    .delete(authMiddleware, ceoOnlyMiddleware, taskController.deleteTask); // New DELETE route

router.put('/:id/status', authMiddleware, taskController.updateTaskStatus);
router.post('/:taskId/time', authMiddleware, timeEntryController.logTime);

module.exports = router;