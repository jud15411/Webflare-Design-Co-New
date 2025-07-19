const express = require('express');
// This option is essential for nested routes to access parent params (like :projectId)
const router = express.Router({ mergeParams: true });
const fileController = require('../controllers/fileController');
const { authMiddleware, adminOnlyMiddleware, ownerOrAdminMiddleware } = require('../middleware/authMiddleware');
const { uploadProjectFile } = require('../middleware/uploadMiddleware');

// This route now correctly corresponds to GET /api/projects/:projectId/files
router.route('/files')
    .get(authMiddleware, ownerOrAdminMiddleware, fileController.getProjectFiles)
    .post(authMiddleware, adminOnlyMiddleware, uploadProjectFile, fileController.uploadProjectFile);

module.exports = router;