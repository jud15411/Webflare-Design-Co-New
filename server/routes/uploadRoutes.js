const express = require('express');
const router = express.Router();
const { uploadFile } = require('../controllers/uploadController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, uploadFile);

module.exports = router;