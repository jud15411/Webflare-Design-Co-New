const Contract = require('../models/Contract');
const User = require('../models/User');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Notification = require('../models/Notification');

// @desc    Get all contracts
// @route   GET /api/contracts
// @access  Admin
exports.getContracts = async (req, res) => {
    try {
        const contracts = await Contract.find().populate({
            path: 'projectId',
            select: 'title clientId',
            populate: {
                path: 'clientId',
                select: 'name'
            }
        });
        res.json(contracts);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Create a new contract
// @route   POST /api/contracts
// @access  Admin
exports.createContract = async (req, res) => {
    try {
        const newContract = new Contract(req.body);
        await newContract.save();

        // Notify CEO of new contract
        const ceo = await User.findOne({ role: 'CEO' });
        if (ceo) {
            const creator = await User.findById(req.userId);
            const project = await Project.findById(newContract.projectId);
            const client = await Client.findById(project.clientId);
            const message = `A new contract for ${client.name} (${project.title}) was created by ${creator.name}.`;
            new Notification({ recipient: ceo._id, message, link: `/contracts` }).save();
        }

        res.status(201).json(newContract);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Update a contract
// @route   PUT /api/contracts/:id
// @access  Admin
exports.updateContract = async (req, res) => {
    try {
        const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!contract) {
            return res.status(404).json({ msg: 'Contract not found' });
        }
        res.json(contract);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a contract
// @route   DELETE /api/contracts/:id
// @access  Admin
exports.deleteContract = async (req, res) => {
    try {
        const contract = await Contract.findByIdAndDelete(req.params.id);
        if (!contract) {
            return res.status(404).json({ msg: 'Contract not found' });
        }
        res.json({ msg: 'Contract deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};