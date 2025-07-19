const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authMiddleware');

// Note: This router is not nested, so it uses its own params.
// The ProjectDetail page will call this route directly with the milestone ID.
router.put('/:milestoneId/status', authMiddleware, adminOnlyMiddleware, milestoneController.updateMilestoneStatus);

module.exports = router;