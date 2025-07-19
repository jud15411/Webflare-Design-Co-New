const express = require('express');
const router = express.Router({ mergeParams: true });
const fileController = require('../controllers/fileController');
const { authMiddleware, adminOnlyMiddleware, ownerOrAdminMiddleware, ceoOnlyMiddleware } = require('../middleware/authMiddleware');
const { uploadProjectFile } = require('../middleware/uploadMiddleware');

router.route('/files')
    .get(authMiddleware, ownerOrAdminMiddleware, fileController.getProjectFiles)
    .post(authMiddleware, adminOnlyMiddleware, uploadProjectFile, fileController.uploadProjectFile);

// New route for deleting a specific file
router.route('/files/:fileId')
    .delete(authMiddleware, ceoOnlyMiddleware, fileController.deleteProjectFile);

module.exports = router;