const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const milestoneController = require('../controllers/milestoneController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authMiddleware');
const { uploadProjectImage } = require('../middleware/uploadMiddleware');


router.route('/')
    .get(authMiddleware, adminOnlyMiddleware, projectController.getAllProjects)
    .post(authMiddleware, adminOnlyMiddleware, uploadProjectImage, projectController.createProject);

router.route('/:id')
    .get(authMiddleware, projectController.getProjectById)
    .delete(authMiddleware, adminOnlyMiddleware, projectController.deleteProject);

router.put('/:id/toggle-feature', authMiddleware, adminOnlyMiddleware, projectController.toggleProjectFeature);
router.get('/:projectId/hours', authMiddleware, projectController.getProjectHours);

// Nested Milestone Routes
router.route('/:projectId/milestones')
    .get(authMiddleware, milestoneController.getProjectMilestones)
    .post(authMiddleware, adminOnlyMiddleware, milestoneController.createProjectMilestone);

// Public Route
router.get('/featured', projectController.getFeaturedProjects);


module.exports = router;