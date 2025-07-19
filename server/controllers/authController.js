// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailUtils');
const JWT_SECRET = process.env.JWT_SECRET;

// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
    // ... (logic from your app.post('/api/auth/login', ...) route)
};

// @route   GET /api/auth/user
exports.getAuthenticatedUser = async (req, res) => {
    // ... (logic from your app.get('/api/auth/user', ...) route)
};

// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
    // ... (logic from your app.post('/api/auth/register', ...) route)
};

// @route   POST /api/auth/resend-verification
exports.resendVerification = async (req, res) => {
    // ... (logic from your app.post('/api/auth/resend-verification', ...) route)
};

// @route   GET /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
    // ... (logic from your app.get('/api/auth/verify-email', ...) route)
};