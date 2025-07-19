const Milestone = require('../models/Milestone');

// @desc    Get all milestones for a project
// @route   GET /api/projects/:projectId/milestones
// @access  Authenticated
exports.getProjectMilestones = async (req, res) => {
    try {
        const milestones = await Milestone.find({ projectId: req.params.projectId })
            .populate('lastSuggestedBy', 'name')
            .sort({ dueDate: 1 });
        res.json(milestones);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error fetching milestones.' });
    }
};

// @desc    Create a milestone for a project
// @route   POST /api/projects/:projectId/milestones
// @access  Admin
exports.createProjectMilestone = async (req, res) => {
    try {
        const { name, description, dueDate } = req.body;
        const { projectId } = req.params;
        if (!name || !dueDate) {
            return res.status(400).json({ msg: 'Name and due date are required.' });
        }
        const newMilestone = new Milestone({
            name, description, dueDate, projectId, status: 'Not Started'
        });
        await newMilestone.save();
        res.status(201).json(newMilestone);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error adding milestone.' });
    }
};

// @desc    Update milestone status
// @route   PUT /api/milestones/:id/status
// @access  Admin
exports.updateMilestoneStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        const allowed = ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Canceled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ msg: 'Invalid status value.' });
        }
        const update = { status };
        if (status === 'Completed') {
            update.completionDate = new Date();
        } else {
            update.$unset = { completionDate: 1 };
        }
        const updatedMilestone = await Milestone.findByIdAndUpdate(id, update, { new: true })
            .populate('lastSuggestedBy', 'name');

        if (!updatedMilestone) {
            return res.status(404).json({ msg: 'Milestone not found.' });
        }
        res.json(updatedMilestone);
    } catch (err) {
        res.status(500).json({ msg: 'Server error updating milestone status.' });
    }
};
// ... (Add other milestone functions: updateMilestone, deleteMilestone, etc.)