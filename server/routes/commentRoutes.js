const express = require('express');
// This option is essential for nested routes
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { authMiddleware, ownerOrAdminMiddleware } = require('../middleware/authMiddleware');

// This route now correctly corresponds to GET /api/projects/:projectId/comments
router.route('/comments')
    .get(authMiddleware, ownerOrAdminMiddleware, commentController.getProjectComments)
    .post(authMiddleware, ownerOrAdminMiddleware, commentController.createComment);

module.exports = router;