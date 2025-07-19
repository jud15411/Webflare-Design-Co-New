const File = require('../models/File');
const fs = require('fs');
const path = require('path');

// @desc    Get all files for a project
exports.getProjectFiles = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ msg: 'Project ID is missing.' });
        }
        const files = await File.find({ projectId }).sort({ createdAt: -1 });
        res.json(files);
    } catch (err) {
        console.error('Error fetching files:', err);
        res.status(500).json({ msg: 'Server error while fetching files.' });
    }
};

// @desc    Upload a file to a project
exports.uploadProjectFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file selected for upload.' });
        }
        const { originalname, path: filePath, mimetype, size } = req.file;
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
        res.status(500).json({ msg: 'Server error on file save.' });
    }
};

// @desc    Delete a project file
// @route   DELETE /api/projects/:projectId/files/:fileId
exports.deleteProjectFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.fileId);
        if (!file) {
            return res.status(404).json({ msg: 'File not found.' });
        }

        const filePath = path.join(__dirname, '..', '..', file.path); // Correct path from /server directory
        fs.unlink(filePath, async (err) => {
            if (err) {
                console.error('Failed to delete physical file, but proceeding with DB record deletion:', err.message);
            }
            await File.findByIdAndDelete(req.params.fileId);
            res.json({ msg: 'File deleted successfully.' });
        });
    } catch (err) {
        console.error('Error deleting file:', err);
        res.status(500).json({ msg: 'Server error while deleting file.' });
    }
};