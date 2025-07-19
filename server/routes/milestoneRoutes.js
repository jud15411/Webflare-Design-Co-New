const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authMiddleware');

router.put('/:id/status', authMiddleware, adminOnlyMiddleware, milestoneController.updateMilestoneStatus);
// ... (Add other milestone routes)

module.exports = router;