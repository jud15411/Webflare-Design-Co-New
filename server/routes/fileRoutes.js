const express = require('express');
// mergeParams allows us to access params from parent router (e.g., :projectId)
const router = express.Router({ mergeParams: true }); 
const fileController = require('../controllers/fileController');
const { authMiddleware, adminOnlyMiddleware, ownerOrAdminMiddleware } = require('../middleware/authMiddleware');
const { uploadProjectFile } = require('../middleware/uploadMiddleware');

router.route('/files')
    .get(authMiddleware, ownerOrAdminMiddleware, fileController.getProjectFiles)
    .post(authMiddleware, adminOnlyMiddleware, uploadProjectFile, fileController.uploadProjectFile);

module.exports = router;