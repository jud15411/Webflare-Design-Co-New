const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, adminOnlyMiddleware, ceoOnlyMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, adminOnlyMiddleware, userController.getUsers);
router.put('/:id', authMiddleware, ceoOnlyMiddleware, userController.updateUser);
router.delete('/:id', authMiddleware, ceoOnlyMiddleware, userController.deleteUser);

module.exports = router;