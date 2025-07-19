// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        req.userClientId = decoded.clientId || null;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const adminOnlyMiddleware = (req, res, next) => {
    const userRole = req.userRole ? req.userRole.trim().toUpperCase() : '';
    if (!['CEO', 'CTO', 'SALES'].includes(userRole)) {
        return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }
    next();
};

const ceoOnlyMiddleware = (req, res, next) => {
    const userRole = req.userRole ? req.userRole.trim().toUpperCase() : '';
    if (userRole !== 'CEO') {
        return res.status(403).json({ msg: 'Access denied. CEO privileges required.' });
    }
    next();
};

const clientOnlyMiddleware = (req, res, next) => {
    const userRole = req.userRole ? req.userRole.trim().toUpperCase() : '';
    if (userRole !== 'CLIENT') {
        return res.status(403).json({ msg: 'Access denied. Client privileges required.' });
    }
    next();
};

const ownerOrAdminMiddleware = async (req, res, next) => {
    // ... (ownerOrAdminMiddleware logic from your server.js)
};


module.exports = {
    authMiddleware,
    adminOnlyMiddleware,
    ceoOnlyMiddleware,
    clientOnlyMiddleware,
    ownerOrAdminMiddleware
};