const User = require('../models/User');
const Client = require('../models/Client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailUtils');
const Notification = require('../models/Notification');

const JWT_SECRET = process.env.JWT_SECRET;

// @desc    Login a user
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user and populate their client company name if they are a client
        const user = await User.findOne({ email }).populate('clientId', 'name');

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check if the user has verified their email
        if (!user.isEmailVerified) {
            return res.status(401).json({ 
                msg: 'Please verify your email to log in.', 
                errorCode: 'EMAIL_NOT_VERIFIED', 
                email: user.email 
            });
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Create the JWT payload
        const payload = {
            id: user.id,
            role: user.role,
            clientId: user.role === 'Client' && user.clientId ? user.clientId._id : null
        };

        // **FIX:** Use the synchronous version of jwt.sign within the try/catch block
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

        // Send the token and user info back to the client
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                clientCompany: user.clientId ? { _id: user.clientId._id, name: user.clientId.name } : null
            }
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).send('Server error');
    }
};

// ... (rest of your authController.js functions: getAuthenticatedUser, registerUser, etc.)

exports.getAuthenticatedUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password').populate('clientId', 'name');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role, clientId } = req.body;

        if (role === 'CEO' || role === 'CTO') {
            const existingRoleHolder = await User.findOne({ role });
            if (existingRoleHolder) {
                return res.status(400).json({ msg: `A user with the role ${role} already exists.` });
            }
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        if (role === 'Client' && !clientId) {
            return res.status(400).json({ msg: 'Client users must be assigned to a Client company.' });
        }
        if (clientId && !(await Client.findById(clientId))) {
            return res.status(400).json({ msg: 'Invalid Client ID provided.' });
        }

        const emailVerificationToken = crypto.randomBytes(20).toString('hex');
        user = new User({
            name,
            email,
            password,
            role,
            emailVerificationToken,
            clientId: role === 'Client' ? clientId : undefined
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        await sendVerificationEmail(user);

        const ceo = await User.findOne({ role: 'CEO' });
        const creator = await User.findById(req.userId);
        if (ceo && ceo._id.toString() !== creator._id.toString()) {
            const message = `${creator.name} registered a new user: ${user.name} (${user.role}).`;
            new Notification({ recipient: ceo._id, message, link: '/users' }).save();
        }

        res.status(201).json({ msg: 'User registered. Verification email sent.', userId: user._id });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).send('Server error');
    }
};

exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        if (user.isEmailVerified) {
            return res.status(400).json({ msg: 'Email is already verified.' });
        }

        user.emailVerificationToken = crypto.randomBytes(20).toString('hex');
        await user.save();

        await sendVerificationEmail(user);

        res.json({ msg: 'New verification email sent successfully!' });
    } catch (err) {
        console.error('Resend Verification Error:', err);
        res.status(500).send('Server error.');
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({ emailVerificationToken: token });
        const clientUrl = process.env.CLIENT_PORTAL_URL || 'http://localhost:3001';

        if (!user) {
            return res.redirect(`${clientUrl}/login?verificationStatus=failed&message=${encodeURIComponent('Invalid token.')}`);
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();

        return res.redirect(`${clientUrl}/login?verificationStatus=success&email=${encodeURIComponent(user.email)}`);
    } catch (err) {
        console.error('Email Verification Error:', err);
        const clientUrl = process.env.CLIENT_PORTAL_URL || 'http://localhost:3001';
        return res.redirect(`${clientUrl}/login?verificationStatus=error&message=${encodeURIComponent('Server error.')}`);
    }
};