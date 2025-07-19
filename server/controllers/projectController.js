const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const Task = require('../models/Task');
const File = require('../models/File');
const Comment = require('../models/Comment');
const TimeEntry = require('../models/TimeEntry');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// @desc    Get all projects for admin view
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.aggregate([
            { $lookup: { from: 'clients', localField: 'clientId', foreignField: '_id', as: 'clientDetails' } },
            { $unwind: { path: '$clientDetails', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'comments', localField: '_id', foreignField: 'projectId', as: 'comments' } },
            { $project: { _id: 1, title: 1, status: 1, imageUrl: 1, createdAt: 1, client: { _id: '$clientDetails._id', name: '$clientDetails.name' }, commentCount: { $size: '$comments' } } },
            { $sort: { createdAt: -1 } }
        ]);
        res.json(projects);
    } catch (err) {
        console.error('Error fetching all projects:', err);
        res.status(500).json({ msg: 'Server Error fetching projects.' });
    }
};

// @desc    Create a new project
exports.createProject = async (req, res) => {
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

// @desc    Get a single project by ID (basic info)
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

// @desc    Delete a project and all its associated data
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }
        // Cascade delete all related documents
        await Milestone.deleteMany({ projectId: req.params.id });
        await Task.deleteMany({ projectId: req.params.id });
        await File.deleteMany({ projectId: req.params.id });
        await Comment.deleteMany({ project: req.params.id });
        await TimeEntry.deleteMany({ project: req.params.id });
        res.json({ msg: 'Project and all associated data removed successfully' });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).send('Server Error');
    }
};

// @desc    Toggle a project's featured status
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
exports.getProjectHours = async (req, res) => {
    try {
        const { id } = req.params; // Using 'id' to be consistent
        const totalHoursResult = await TimeEntry.aggregate([
            { $match: { project: new mongoose.Types.ObjectId(id) } },
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
exports.getFeaturedProjects = async (req, res) => {
    try {
        const featured = await Project.find({ isFeatured: true }).limit(5);
        res.json(featured);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Get all data for the project detail page in one call
exports.getProjectDetailData = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: 'Invalid Project ID' });
        }
        const [project, milestones, files, comments] = await Promise.all([
            Project.findById(id).populate('clientId', 'name'),
            Milestone.find({ projectId: id }).sort({ dueDate: 1 }),
            File.find({ projectId: id }).sort({ createdAt: -1 }),
            Comment.find({ project: id }).sort({ createdAt: -1 }).populate('author', 'name')
        ]);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }
        res.json({ project, milestones, files, comments });
    } catch (err) {
        console.error('Error fetching project detail data:', err);
        res.status(500).json({ msg: 'Server error while fetching comprehensive project details.' });
    }
};