const Service = require('../models/Service');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (err) { res.status(500).send('Server Error'); }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Admin
exports.createService = async (req, res) => {
    try {
        const newService = new Service(req.body);
        await newService.save();
        res.status(201).json(newService);
    } catch (err) { res.status(500).send('Server Error'); }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Admin
exports.updateService = async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!service) return res.status(404).json({ msg: 'Service not found' });
        res.json(service);
    } catch (err) { res.status(500).send('Server Error'); }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Admin
exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) return res.status(404).json({ msg: 'Service not found' });
        res.json({ msg: 'Service deleted successfully' });
    } catch (err) { res.status(500).send('Server Error'); }
};