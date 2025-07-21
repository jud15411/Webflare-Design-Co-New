const express = require('express');
const router = express.Router();
const { createTask, getTasks, getTask, updateTask, deleteTask } = require('../controllers/taskController');

<<<<<<< HEAD
// Define your routes
router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
=======
router.route('/')
    .get(authMiddleware, taskController.getTasks)
    .post(authMiddleware, adminOnlyMiddleware, taskController.createTask);

router.route('/:id')
    .put(authMiddleware, adminOnlyMiddleware, taskController.updateTask)
    .delete(authMiddleware, ceoOnlyMiddleware, taskController.deleteTask); // New DELETE route

router.put('/:id/status', authMiddleware, taskController.updateTaskStatus);
router.post('/:taskId/time', authMiddleware, timeEntryController.logTime);
>>>>>>> parent of b0383fd (update)

module.exports = router;