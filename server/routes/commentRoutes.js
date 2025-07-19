const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { authMiddleware, ownerOrAdminMiddleware, ceoOnlyMiddleware } = require('../middleware/authMiddleware');

router.route('/comments')
    .get(authMiddleware, ownerOrAdminMiddleware, commentController.getProjectComments)
    .post(authMiddleware, ownerOrAdminMiddleware, commentController.createComment);

// New route for deleting a specific comment
router.route('/comments/:commentId')
    .delete(authMiddleware, ceoOnlyMiddleware, commentController.deleteComment);

module.exports = router;