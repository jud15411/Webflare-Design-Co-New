const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnlyMiddleware} = require('../middleware/authMiddleware');

// Correctly import functions using object destructuring
const {
    createTimeEntry,
    getTimeEntriesForTask,
    updateTimeEntry,
    deleteTimeEntry
} = require('../controllers/timeEntryController');

// Define your routes using the imported functions directly
// All routes are protected by auth middleware
router.post('/', authMiddleware, createTimeEntry);
router.get('/task/:taskId', authMiddleware, getTimeEntriesForTask);
router.put('/:id', authMiddleware, updateTimeEntry);
router.delete('/:id', authMiddleware, deleteTimeEntry);

module.exports = router;