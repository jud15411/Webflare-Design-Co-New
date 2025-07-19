const express = require('express');
// **THE FIX:** Add { mergeParams: true } here as well for consistency.
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { authMiddleware, ownerOrAdminMiddleware } = require('../middleware/authMiddleware');

router.route('/comments')
    .get(authMiddleware, ownerOrAdminMiddleware, commentController.getProjectComments)
    .post(authMiddleware, ownerOrAdminMiddleware, commentController.createComment);

module.exports = router;