const express = require('express');
// THE FIX: Allows this router to access URL params from parent routers (e.g., :projectId)
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { authMiddleware, ownerOrAdminMiddleware } = require('../middleware/authMiddleware');

// Route: GET /api/projects/:projectId/comments
// Route: POST /api/projects/:projectId/comments
router.route('/comments')
    .get(authMiddleware, ownerOrAdminMiddleware, commentController.getProjectComments)
    .post(authMiddleware, ownerOrAdminMiddleware, commentController.createComment);

module.exports = router;