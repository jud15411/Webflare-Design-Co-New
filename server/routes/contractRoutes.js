const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authMiddleware, adminOnlyMiddleware } = require('../middleware/authMiddleware');

router.route('/')
    .get(authMiddleware, adminOnlyMiddleware, contractController.getContracts)
    .post(authMiddleware, adminOnlyMiddleware, contractController.createContract);

router.route('/:id')
    .put(authMiddleware, adminOnlyMiddleware, contractController.updateContract)
    .delete(authMiddleware, adminOnlyMiddleware, contractController.deleteContract);

module.exports = router;