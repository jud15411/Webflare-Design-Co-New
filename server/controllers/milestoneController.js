const Milestone = require('../models/Milestone');

// @desc    Create a milestone for a project
exports.createMilestone = async (req, res) => {
    try {
        const newMilestone = new Milestone({
            ...req.body,
            projectId: req.params.projectId
        });
        await newMilestone.save();
        res.status(201).json(newMilestone);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update a milestone's status
// @route   PUT /api/milestones/:milestoneId/status
exports.updateMilestoneStatus = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { status } = req.body;
        const validStatuses = ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Canceled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Invalid status provided.' });
        }
        
        const milestone = await Milestone.findById(milestoneId);
        if (!milestone) {
            return res.status(404).json({ msg: 'Milestone not found.' });
        }

        milestone.status = status;
        milestone.completionDate = status === 'Completed' ? new Date() : null;

        await milestone.save();
        res.json(milestone);
    } catch (err) {
        console.error('Error updating milestone status:', err);
        res.status(500).json({ msg: 'Server error while updating status.' });
    }
};