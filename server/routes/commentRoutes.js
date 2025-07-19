const express = require('express');
// mergeParams allows us to access :projectId from the parent router (projectRoutes)
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { authMiddleware, ownerOrAdminMiddleware } = require('../middleware/authMiddleware');

router.route('/comments')
    .get(authMiddleware, ownerOrAdminMiddleware, commentController.getProjectComments)
    .post(authMiddleware, ownerOrAdminMiddleware, commentController.createComment);

module.exports = router;