const Comment = require('../models/Comment');
const Project = require('../models/Project');

// @desc    Get all comments for a project
exports.getProjectComments = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!projectId) return res.status(400).json({ msg: 'Project ID is required.' });
        const comments = await Comment.find({ project: projectId }).sort({ createdAt: -1 }).populate('author', 'name');
        res.json(comments);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Create a comment on a project
exports.createComment = async (req, res) => {
    try {
        const newComment = new Comment({
            text: req.body.text,
            author: req.userId,
            project: req.params.projectId
        });
        await newComment.save();
        const populatedComment = await Comment.findById(newComment._id).populate('author', 'name');
        res.status(201).json(populatedComment);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Delete a project comment
// @route   DELETE /api/projects/:projectId/comments/:commentId
exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found.' });
        }
        // Optional: Check if user is the author or an admin
        await Comment.findByIdAndDelete(req.params.commentId);
        res.json({ msg: 'Comment deleted successfully.' });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ msg: 'Server error while deleting comment.' });
    }
};