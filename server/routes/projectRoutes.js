const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authMiddleware');
const { uploadProjectImage } = require('../middleware/uploadMiddleware');

// === Main Project Routes ===
router.route('/')
    .get(authMiddleware, adminOnlyMiddleware, projectController.getAllProjects)
    .post(authMiddleware, adminOnlyMiddleware, uploadProjectImage, projectController.createProject);

// =================================================================
// ## THE NEW, SIMPLIFIED ROUTE FOR ALL DETAIL DATA ##
// =================================================================
router.get('/:id/details', authMiddleware, projectController.getProjectDetailData);


// === Other Project-Specific Routes ===
router.route('/:id')
    .get(authMiddleware, projectController.getProjectById) // This can still exist if needed elsewhere
    .delete(authMiddleware, adminOnlyMiddleware, projectController.deleteProject);

router.put('/:id/toggle-feature', authMiddleware, adminOnlyMiddleware, projectController.toggleProjectFeature);
router.get('/:id/hours', authMiddleware, projectController.getProjectHours);
router.get('/featured', projectController.getFeaturedProjects);

// NOTE: We no longer need to register the nested file and comment routers here,
// as their functionality is now handled by the new '/details' route for this page.
// You would still need them if you have other pages that ONLY fetch files or comments.
// For the purpose of fixing ProjectDetail.js, they are no longer the primary method.
const fileRoutes = require('./fileRoutes');
const commentRoutes = require('./commentRoutes');
router.use('/:projectId', fileRoutes);
router.use('/:projectId', commentRoutes);


module.exports = router;