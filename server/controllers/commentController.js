const Comment = require('../models/Comment');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all comments for a project
// @route   GET /api/projects/:projectId/comments
exports.getProjectComments = async (req, res) => {
    try {
        const { projectId } = req.params;
        // Check that the projectId is being received correctly
        if (!projectId) {
            return res.status(400).json({ msg: 'Project ID is missing from the request.' });
        }
        const comments = await Comment.find({ project: projectId })
            .sort({ createdAt: -1 })
            .populate('author', 'name');
        res.json(comments);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ msg: 'Server error while fetching comments.' });
    }
};

// @desc    Create a comment on a project
// @route   POST /api/projects/:projectId/comments
exports.createComment = async (req, res) => {
    try {
        const { text } = req.body;
        const { projectId } = req.params;

        if (!text || !projectId) {
            return res.status(400).json({ msg: 'Comment text and Project ID are required.' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const newComment = new Comment({
            text,
            author: req.userId,
            project: projectId
        });
        await newComment.save();

        // Populate the author's details before sending the response
        const populatedComment = await Comment.findById(newComment._id).populate('author', 'name');
        
        // Notify users (optional, can be refined)
        // ... your notification logic here ...

        res.status(201).json(populatedComment);
    } catch (err) {
        console.error('Error creating comment:', err);
        res.status(500).send({ msg: 'Server error while creating comment.' });
    }
};