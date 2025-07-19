const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
// Correctly import the middleware
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authMiddleware');
const { uploadProjectImage } = require('../middleware/uploadMiddleware');

// Import the nested routers
const fileRoutes = require('./fileRoutes');
const commentRoutes = require('./commentRoutes');

// === Main Project Routes ===
router.route('/')
    .get(authMiddleware, adminOnlyMiddleware, projectController.getAllProjects)
    // **THE FIX:** The typo "adminOnlyMiddlware" has been corrected to "adminOnlyMiddleware"
    .post(authMiddleware, adminOnlyMiddleware, uploadProjectImage, projectController.createProject);

router.route('/:id')
    .get(authMiddleware, projectController.getProjectById)
    .delete(authMiddleware, adminOnlyMiddleware, projectController.deleteProject);

router.put('/:id/toggle-feature', authMiddleware, adminOnlyMiddleware, projectController.toggleProjectFeature);
router.get('/:id/hours', authMiddleware, projectController.getProjectHours);
router.get('/featured', projectController.getFeaturedProjects);

// === Register Nested Routes ===
// This correctly forwards requests for files and comments to their respective routers
router.use('/:projectId', fileRoutes);
router.use('/:projectId', commentRoutes);

module.exports = router;