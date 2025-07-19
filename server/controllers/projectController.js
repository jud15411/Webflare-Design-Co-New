const Project = require('../models/Project');
const User = require('../models/User');
const Milestone = require('../models/Milestone');
const Task = require('../models/Task');
const File = require('../models/File');
const TimeEntry = require('../models/TimeEntry');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// @desc    Get all projects for admin view
// @route   GET /api/projects
// @access  Admin
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.aggregate([
            {
                $lookup: { from: 'clients', localField: 'clientId', foreignField: '_id', as: 'clientDetails' }
            },
            {
                $unwind: { path: '$clientDetails', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: { from: 'comments', localField: '_id', foreignField: 'projectId', as: 'comments' }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    status: 1,
                    imageUrl: 1,
                    createdAt: 1,
                    client: { _id: '$clientDetails._id', name: '$clientDetails.name' },
                    commentCount: { $size: '$comments' }
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);
        res.json(projects);
    } catch (err) {
        console.error('Error fetching all projects:', err);
        res.status(500).json({ msg: 'Server Error fetching projects.' });
    }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Admin
exports.createProject = async (req, res) => {
    // Note: uploadProjectImage middleware handles file upload
    const { title, description, status, clientId } = req.body;
    const imageUrl = req.file ? `/public/uploads/${req.file.filename}` : '';
    const newProject = new Project({ title, description, status, clientId, imageUrl });
    try {
        await newProject.save();
        const ceo = await User.findOne({ role: 'CEO' });
        if (ceo) {
            const creator = await User.findById(req.userId);
            const message = `${creator.name} created a new project: "${newProject.title}".`;
            new Notification({ recipient: ceo._id, message, link: `/projects` }).save();
        }
        res.status(201).json(newProject);
    } catch (serverErr) {
        res.status(500).send('Server error on save');
    }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Authenticated
exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: 'Invalid Project ID format.' });
        }
        const project = await Project.findById(id).populate('clientId', 'name');
        if (!project) {
            return res.status(404).json({ msg: 'Project not found.' });
        }
        res.json(project);
    } catch (err) {
        console.error('Error in GET /api/projects/:id:', err);
        res.status(500).json({ msg: 'Server error while fetching project details.' });
    }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Admin
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        // Cascade delete
        await Milestone.deleteMany({ projectId: req.params.id });
        await Task.deleteMany({ projectId: req.params.id });
        await File.deleteMany({ projectId: req.params.id });
        res.json({ msg: 'Project and all associated data removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Toggle a project's featured status
// @route   PUT /api/projects/:id/toggle-feature
// @access  Admin
exports.toggleProjectFeature = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        if (!project.isFeatured) {
            const featuredCount = await Project.countDocuments({ isFeatured: true });
            if (featuredCount >= 5) return res.status(400).json({ msg: 'Cannot feature more than 5 projects.' });
        }
        project.isFeatured = !project.isFeatured;
        await project.save();
        res.json(project);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Get total hours logged for a project
// @route   GET /api/projects/:projectId/hours
// @access  Authenticated
exports.getProjectHours = async (req, res) => {
    try {
        const { projectId } = req.params;
        const totalHoursResult = await TimeEntry.aggregate([
            { $match: { project: new mongoose.Types.ObjectId(projectId) } },
            { $group: { _id: null, totalHours: { $sum: '$hours' } } }
        ]);
        const totalHours = totalHoursResult.length > 0 ? totalHoursResult[0].totalHours : 0;
        res.json({ totalHours });
    } catch (err) {
        console.error('Error fetching project hours:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get public featured projects
// @route   GET /api/featured-projects
// @access  Public
exports.getFeaturedProjects = async (req, res) => {
    try {
        const featured = await Project.find({ isFeatured: true }).limit(5);
        res.json(featured);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};