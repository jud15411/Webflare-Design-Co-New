// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, ceoOnlyMiddleware } = require('../middleware/authMiddleware');

router.post('/login', authController.loginUser);
router.get('/user', authMiddleware, authController.getAuthenticatedUser);
router.post('/register', authMiddleware, ceoOnlyMiddleware, authController.registerUser);
router.post('/resend-verification', authController.resendVerification);
router.get('/verify-email', authController.verifyEmail);

module.exports = router;