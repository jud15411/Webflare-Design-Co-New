// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Project Image Storage
const projectImageStorage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, 'projectImage-' + Date.now() + path.extname(file.originalname));
  }
});

// Project File Storage
const projectFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `public/project_files/${req.params.projectId}`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const uploadProjectImage = multer({ storage: projectImageStorage }).single('projectImage');
const uploadProjectFile = multer({ storage: projectFileStorage }).single('projectFile');

module.exports = { uploadProjectImage, uploadProjectFile };