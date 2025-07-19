const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const Milestone = require('../models/Milestone');
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify token and attach user info to request
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
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

// Middleware for admin-only routes
const adminOnlyMiddleware = (req, res, next) => {
    const userRole = req.userRole ? req.userRole.trim().toUpperCase() : '';
    if (!['CEO', 'CTO', 'SALES'].includes(userRole)) {
        return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }
    next();
};

// Middleware for CEO-only routes
const ceoOnlyMiddleware = (req, res, next) => {
    const userRole = req.userRole ? req.userRole.trim().toUpperCase() : '';
    if (userRole !== 'CEO') {
        return res.status(403).json({ msg: 'Access denied. CEO privileges required.' });
    }
    next();
};

// Middleware for client-only routes
const clientOnlyMiddleware = (req, res, next) => {
    const userRole = req.userRole ? req.userRole.trim().toUpperCase() : '';
    if (userRole !== 'CLIENT') {
        return res.status(403).json({ msg: 'Access denied. Client privileges required.' });
    }
    next();
};

// Middleware to check if user is admin or the client owner of a resource
const ownerOrAdminMiddleware = async (req, res, next) => {
    try {
        const userRole = req.userRole ? req.userRole.trim().toUpperCase() : '';
        const userClientId = req.userClientId;
        const { projectId, milestoneId } = req.params;

        if (['CEO', 'CTO', 'SALES'].includes(userRole)) {
            return next();
        }

        if (userRole === 'CLIENT') {
            if (!userClientId) {
                return res.status(403).json({ msg: 'Client user is not associated with a client company.' });
            }

            let resourceClientId;

            if (projectId) {
                const project = await Project.findById(projectId);
                if (!project) return res.status(404).json({ msg: 'Project not found.' });
                resourceClientId = project.clientId?.toString();
            } else if (milestoneId) {
                const milestone = await Milestone.findById(milestoneId).populate('projectId');
                if (!milestone) return res.status(404).json({ msg: 'Milestone not found.' });
                resourceClientId = milestone.projectId?.clientId?.toString();
            }

            if (resourceClientId && resourceClientId === userClientId) {
                return next();
            }
        }
        
        return res.status(403).json({ msg: 'Access denied. You do not have permission to view this resource.' });

    } catch (err) {
        console.error('Authorization Middleware Error:', err);
        return res.status(500).json({ msg: 'Server error during authorization check.' });
    }
};

module.exports = {
    authMiddleware,
    adminOnlyMiddleware,
    ceoOnlyMiddleware,
    clientOnlyMiddleware,
    ownerOrAdminMiddleware
};