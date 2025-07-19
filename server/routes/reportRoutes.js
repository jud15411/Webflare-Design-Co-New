const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authMiddleware');

router.get('/time-by-project', authMiddleware, adminOnlyMiddleware, reportController.getTimeByProject);
router.get('/time-by-user-project', authMiddleware, adminOnlyMiddleware, reportController.getTimeByUserProject);
router.get('/task-status-summary', authMiddleware, adminOnlyMiddleware, reportController.getTaskStatusSummary);

module.exports = router;