const express = require('express');
// **THE FIX:** Add { mergeParams: true } to the Router constructor.
const router = express.Router({ mergeParams: true });
const fileController = require('../controllers/fileController');
const { authMiddleware, adminOnlyMiddleware, ownerOrAdminMiddleware } = require('../middleware/authMiddleware');
const { uploadProjectFile } = require('../middleware/uploadMiddleware');

router.route('/files')
    .get(authMiddleware, ownerOrAdminMiddleware, fileController.getProjectFiles)
    .post(authMiddleware, adminOnlyMiddleware, uploadProjectFile, fileController.uploadProjectFile);

module.exports = router;