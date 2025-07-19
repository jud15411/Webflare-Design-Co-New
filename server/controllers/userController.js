const User = require('../models/User');
const Client = require('../models/Client');
const Notification = require('../models/Notification');

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').populate('clientId', 'name');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  CEO Only
exports.updateUser = async (req, res) => {
    try {
        const { name, email, role, clientId } = req.body;

        if (role === 'CEO' || role === 'CTO') {
            const existingRoleHolder = await User.findOne({ role: role, _id: { $ne: req.params.id } });
            if (existingRoleHolder) {
                return res.status(400).json({ msg: `A user with the role ${role} already exists.` });
            }
        }
        if (role === 'Client' && !clientId) {
            return res.status(400).json({ msg: 'Client users must be assigned to a Client company.' });
        }
        if (clientId && !(await Client.findById(clientId))) {
             return res.status(400).json({ msg: 'Invalid Client ID provided.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, role, clientId: role === 'Client' ? clientId : undefined },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(updatedUser);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  CEO Only
exports.deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.userId) {
            return res.status(400).json({ msg: 'You cannot delete your own account.' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        res.status(500).send('Server error');
    }
};