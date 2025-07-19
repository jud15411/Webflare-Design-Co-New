const express = require('express');
// **THE FIX:** Add { mergeParams: true } to the Router constructor.
// This allows this router to access URL params from parent routers (e.g., :projectId).
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { authMiddleware, ownerOrAdminMiddleware } = require('../middleware/authMiddleware');

router.route('/comments')
    .get(authMiddleware, ownerOrAdminMiddleware, commentController.getProjectComments)
    .post(authMiddleware, ownerOrAdminMiddleware, commentController.createComment);

module.exports = router;