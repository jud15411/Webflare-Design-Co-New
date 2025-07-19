const Client = require('../models/Client');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Admin
exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find();
        res.json(clients);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Create a client
// @route   POST /api/clients
// @access  Admin
exports.createClient = async (req, res) => {
    try {
        const newClient = new Client(req.body);
        await newClient.save();
        res.status(201).json(newClient);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Update a client
// @route   PUT /api/clients/:id
// @access  Admin
exports.updateClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }
        res.json(client);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Admin
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }
        res.json({ msg: 'Client deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};


// @desc    Get projects for the authenticated client
// @route   GET /api/client/projects
// @access  Client
exports.getClientProjects = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.clientId) {
            return res.status(403).json({ msg: 'Client user not associated with a company.' });
        }

        const clientProjects = await Project.find({ clientId: user.clientId })
            .populate('clientId', 'name')
            .sort({ createdAt: -1 });

        const projectsWithDetails = await Promise.all(clientProjects.map(async (project) => {
            const milestones = await Milestone.find({ projectId: project._id }).sort({ dueDate: 1 });
            const tasks = await Task.find({ projectId: project._id }).populate('assignedTo', 'name');

            const milestonesWithTasks = milestones.map(milestone => {
                const tasksForMilestone = tasks.filter(task => task.milestoneId && task.milestoneId.equals(milestone._id));
                return { ...milestone.toObject(), tasks: tasksForMilestone };
            });

            return { ...project.toObject(), milestones: milestonesWithTasks };
        }));

        res.json(projectsWithDetails);
    } catch (err) {
        res.status(500).send('Server error fetching client projects.');
    }
};

// @desc    Add a suggestion to a milestone
// @route   PUT /api/client/milestones/:milestoneId/suggest
// @access  Client
exports.addMilestoneSuggestion = async (req, res) => {
    try {
        const { suggestion } = req.body;
        const { milestoneId } = req.params;
        const userId = req.userId;

        const user = await User.findById(userId).populate('clientId');
        if (!user || !user.clientId) {
            return res.status(403).json({ msg: 'Client user not properly associated.' });
        }

        const milestone = await Milestone.findById(milestoneId).populate('projectId');
        if (!milestone || !milestone.projectId || milestone.projectId.clientId.toString() !== user.clientId._id.toString()) {
            return res.status(403).json({ msg: 'Access denied to this milestone.' });
        }
        
        milestone.clientSuggestions = suggestion;
        milestone.lastSuggestedBy = userId;
        milestone.lastSuggestionDate = new Date();
        await milestone.save();

        // Notify Admins
        const message = `${user.name} added a suggestion to "${milestone.name}" on project "${milestone.projectId.title}".`;
        const admins = await User.find({ role: { $in: ['CEO', 'CTO'] } });
        admins.forEach(admin => {
            if (admin._id.toString() !== userId.toString()){
                 new Notification({ recipient: admin._id, message, link: `/projects/${milestone.projectId._id}` }).save();
            }
        });

        res.json({ msg: 'Suggestion added successfully.', milestone });
    } catch (err) {
        res.status(500).send('Server error adding suggestion.');
    }
};