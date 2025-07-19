const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, notificationController.getNotifications);
router.put('/mark-read', authMiddleware, notificationController.markNotificationsRead);

module.exports = router;