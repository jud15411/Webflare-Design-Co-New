const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authMiddleware');
const { uploadProjectImage } = require('../middleware/uploadMiddleware');

// Import nested routers
const fileRoutes = require('./fileRoutes');
const commentRoutes = require('./commentRoutes');

// === Main Project Routes ===
router.route('/')
    .get(authMiddleware, adminOnlyMiddleware, projectController.getAllProjects)
    // THE FIX: Corrected typo from "adminOnlyMiddlware" to "adminOnlyMiddleware"
    .post(authMiddleware, adminOnlyMiddleware, uploadProjectImage, projectController.createProject);

// This new route efficiently gets all data for the detail page
router.get('/:id/details', authMiddleware, projectController.getProjectDetailData);

// This route handles basic GET by ID and DELETE
router.route('/:id')
    .get(authMiddleware, projectController.getProjectById)
    .delete(authMiddleware, adminOnlyMiddleware, projectController.deleteProject);

// Other specific project routes
router.put('/:id/toggle-feature', authMiddleware, adminOnlyMiddleware, projectController.toggleProjectFeature);
router.get('/:id/hours', authMiddleware, projectController.getProjectHours);
router.get('/featured', projectController.getFeaturedProjects); // This is a public route

// === Nested Routes for POSTing Files/Comments ===
// These are still needed so you can POST new files and comments to a specific project
router.use('/:projectId', fileRoutes);
router.use('/:projectId', commentRoutes);

module.exports = router;