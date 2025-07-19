const express = require('express');
const router = express.Router();
const timeEntryController = require('../controllers/timeEntryController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, timeEntryController.logGeneralTime);

module.exports = router;