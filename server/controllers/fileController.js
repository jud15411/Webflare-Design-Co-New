const File = require('../models/File');

// @desc    Get all files for a project
// @route   GET /api/projects/:projectId/files
exports.getProjectFiles = async (req, res) => {
    try {
        const { projectId } = req.params;
        // Check if projectId exists after the router fix
        if (!projectId) {
            return res.status(400).json({ msg: 'Project ID is missing from the request.' });
        }
        const files = await File.find({ projectId: projectId }).sort({ createdAt: -1 });
        res.json(files);
    } catch (err) {
        console.error('Error fetching project files:', err);
        res.status(500).json({ msg: 'Server error while fetching files.' });
    }
};

// @desc    Upload a file to a project
// @route   POST /api/projects/:projectId/files
exports.uploadProjectFile = async (req, res) => {
    // The 'uploadProjectFile' middleware from uploadMiddleware.js handles the actual upload
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file was selected for upload.' });
        }
        const { originalname, path: filePath, mimetype, size } = req.file;
        // Ensure the path is correctly formatted for web access
        const webPath = `/${filePath.replace(/\\/g, '/')}`;

        const newFile = new File({
            originalName: originalname,
            path: webPath,
            mimetype,
            size,
            projectId: req.params.projectId,
        });

        await newFile.save();
        res.status(201).json(newFile);
    } catch (err) {
        console.error('Error saving file record:', err);
        res.status(500).send({ msg: 'Server error on file save.' });
    }
};