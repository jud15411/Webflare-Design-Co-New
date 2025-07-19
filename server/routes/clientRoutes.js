const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authMiddleware, adminOnlyMiddleware, clientOnlyMiddleware, ownerOrAdminMiddleware } = require('../middleware/authMiddleware');

// Admin routes for managing clients
router.route('/')
    .get(authMiddleware, adminOnlyMiddleware, clientController.getClients)
    .post(authMiddleware, adminOnlyMiddleware, clientController.createClient);

router.route('/:id')
    .put(authMiddleware, adminOnlyMiddleware, clientController.updateClient)
    .delete(authMiddleware, adminOnlyMiddleware, clientController.deleteClient);

// Client-specific portal routes
router.get('/portal/projects', authMiddleware, clientOnlyMiddleware, clientController.getClientProjects);
router.put('/portal/milestones/:milestoneId/suggest', authMiddleware, clientOnlyMiddleware, ownerOrAdminMiddleware, clientController.addMilestoneSuggestion);

module.exports = router;