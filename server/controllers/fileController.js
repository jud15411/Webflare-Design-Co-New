const File = require('../models/File');

// @desc    Get all files for a project
// @route   GET /api/projects/:projectId/files
// @access  Authenticated (with owner/admin check)
exports.getProjectFiles = async (req, res) => {
    try {
        const files = await File.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
        res.json(files);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error fetching files.' });
    }
};

// @desc    Upload a file to a project
// @route   POST /api/projects/:projectId/files
// @access  Admin
exports.uploadProjectFile = async (req, res) => {
    // uploadProjectFile middleware runs first
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file selected' });
        }
        const { originalname, path: filePath, mimetype, size } = req.file;
        const webPath = `/${filePath.replace(/\\/g, '/')}`; // Ensure correct path format
        const newFile = new File({
            originalName: originalname,
            path: webPath,
            mimetype,
            size,
            projectId: req.params.projectId,
        });
        await newFile.save();
        res.status(201).json(newFile);
    } catch (serverErr) {
        res.status(500).send('Server error on file save');
    }
};