const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authMiddleware');
const { uploadProjectImage } = require('../middleware/uploadMiddleware');

// Import the nested routers
const fileRoutes = require('./fileRoutes');
const commentRoutes = require('./commentRoutes');

// === Main Project Routes ===
router.route('/')
    .get(authMiddleware, adminOnlyMiddleware, projectController.getAllProjects)
    .post(authMiddleware, adminOnlyMiddlware, uploadProjectImage, projectController.createProject);

router.route('/:id')
    .get(authMiddleware, projectController.getProjectById)
    .delete(authMiddleware, adminOnlyMiddleware, projectController.deleteProject);

router.put('/:id/toggle-feature', authMiddleware, adminOnlyMiddleware, projectController.toggleProjectFeature);
router.get('/:id/hours', authMiddleware, projectController.getProjectHours); // Corrected from :projectId to :id to match convention
router.get('/featured', projectController.getFeaturedProjects); // Public route, should not have auth middleware if truly public

// =================================================================
// ## THE FIX: REGISTER NESTED ROUTES ##
// This tells the project router that any request to /:projectId/...
// should be handled by the corresponding child router.
// =================================================================
router.use('/:projectId', fileRoutes);
router.use('/:projectId', commentRoutes);

module.exports = router;