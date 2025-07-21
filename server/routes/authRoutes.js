const express = require('express');
const router = express.Router();

// Correctly import ONLY the functions you need using destructuring
const {
    loginUser,
    getAuthenticatedUser,
    registerUser,
    resendVerification,
    verifyEmail
} = require('../controllers/authController');

// Import your middleware
const { authMiddleware, ceoOnlyMiddleware } = require('../middleware/authMiddleware');

// Define the routes using the directly imported functions
router.post('/login', loginUser);
router.get('/user', authMiddleware, getAuthenticatedUser);
router.post('/register', authMiddleware, ceoOnlyMiddleware, registerUser);
router.post('/resend-verification', resendVerification);
router.get('/verify-email', verifyEmail);

module.exports = router;