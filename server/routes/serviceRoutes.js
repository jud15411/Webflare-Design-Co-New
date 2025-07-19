const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authMiddleware');

router.route('/')
    .get(serviceController.getServices) // Publicly accessible
    .post(authMiddleware, adminOnlyMiddleware, serviceController.createService);

router.route('/:id')
    .put(authMiddleware, adminOnlyMiddleware, serviceController.updateService)
    .delete(authMiddleware, adminOnlyMiddleware, serviceController.deleteService);

module.exports = router;