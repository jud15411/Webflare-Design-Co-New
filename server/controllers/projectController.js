const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const Task = require('../models/Task');
const File = require('../models/File');
const Comment = require('../models/Comment');
const TimeEntry = require('../models/TimeEntry');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// ... (your other existing functions like getAllProjects, createProject, etc.)
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

// ... other functions ...

// =================================================================
// ## THE NEW, CONSOLIDATED FUNCTION ##
// =================================================================
exports.getProjectDetailData = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ msg: 'Invalid Project ID' });
        }

        // Fetch all data in parallel for maximum efficiency
        const [project, milestones, files, comments] = await Promise.all([
            Project.findById(id).populate('clientId', 'name'),
            Milestone.find({ projectId: id }).sort({ dueDate: 1 }),
            File.find({ projectId: id }).sort({ createdAt: -1 }),
            Comment.find({ project: id }).sort({ createdAt: -1 }).populate('author', 'name')
        ]);

        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Send all data back in a single, structured object
        res.json({
            project,
            milestones,
            files,
            comments
        });

    } catch (err) {
        console.error('Error fetching project detail data:', err);
        res.status(500).json({ msg: 'Server error while fetching comprehensive project details.' });
    }
};