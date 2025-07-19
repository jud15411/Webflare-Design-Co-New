const Comment = require('../models/Comment');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all comments for a project
// @route   GET /api/projects/:projectId/comments
// @access  Authenticated (with owner/admin check)
exports.getProjectComments = async (req, res) => {
    try {
        // Note: The original code used 'project', let's stick to the schema field name
        const comments = await Comment.find({ project: req.params.projectId })
            .sort({ createdAt: -1 })
            .populate('author', 'name'); // Populate author's name
        res.json(comments);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ msg: 'Server Error fetching comments.' });
    }
};

// @desc    Create a comment on a project
// @route   POST /api/projects/:projectId/comments
// @access  Authenticated (with owner/admin check)
exports.createComment = async (req, res) => {
    try {
        const { text } = req.body;
        const { projectId } = req.params;

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

        // Notify all other users about the new comment
        const author = await User.findById(req.userId);
        const message = `${author.name} commented on project "${project.title}"`;
        const allUsers = await User.find({ _id: { $ne: req.userId } }); // Exclude self
        allUsers.forEach(user => {
            new Notification({
                recipient: user._id,
                message,
                link: `/projects/${project._id}`
            }).save();
        });

        // Populate the author's name before sending the response
        const populatedComment = await Comment.findById(newComment._id).populate('author', 'name');
        res.status(201).json(populatedComment);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};