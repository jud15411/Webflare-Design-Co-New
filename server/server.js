require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// --- Read Environment Variables ---
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
// Define your production URL for the frontend client portal here
const CLIENT_URL = process.env.CLIENT_URL || `http://localhost:${process.env.PORT || 8080}`;


// --- Initialize App & Models ---
const app = express();
const PORT = process.env.PORT || 8080;
const User = require('./models/User');
const Project = require('./models/Project');
const Client = require('./models/Client');
const Task = require('./models/Task');
const Invoice = require('./models/Invoice');
const Contract = require('./models/Contract');
const Service = require('./models/Service');
const Comment = require('./models/Comment');
const TimeEntry = require('./models/TimeEntry');
const Notification = require('./models/Notification');
const Counter = require('./models/Counter');
const Milestone = require('./models/Milestone'); // Ensure Milestone model is imported
const File = require('./models/File');

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// --- Multer Config ---
const projectImageStorage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, 'projectImage-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadProjectImage = multer({ storage: projectImageStorage }).single('projectImage');

const projectFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `public/project_files/${req.params.projectId}`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const uploadProjectFile = multer({ storage: projectFileStorage }).single('projectFile');


// --- DB Connection ---
mongoose.connect(MONGO_URI).then(() => console.log("MongoDB Connected!")).catch(err => console.error(err));

// --- AUTHENTICATION & PERMISSIONS MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        req.userClientId = decoded.clientId || null; // Ensure clientId from token is attached
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
    try {
        const userRole = req.userRole ? req.userRole.trim().toUpperCase() : '';
        // If an admin role, grant access
        if (['CEO', 'CTO', 'SALES'].includes(userRole)) {
            return next();
        }

        // If client, check ownership
        if (userRole === 'CLIENT') {
            const userId = req.userId;
            const user = await User.findById(userId).populate('clientId');
            if (!user || !user.clientId) {
                return res.status(403).json({ msg: 'Access denied. Client not properly associated.' });
            }

            // For project-specific routes (e.g., /api/client/projects/:projectId, /api/projects/:projectId/files)
            if (req.params.projectId) {
                const project = await Project.findById(req.params.projectId);
                if (!project || project.clientId.toString() !== user.clientId._id.toString()) {
                    return res.status(403).json({ msg: 'Access denied. You do not have permission to view this project.' });
                }
            }
            // For milestone-specific routes (e.g., /api/client/milestones/:milestoneId/suggest)
            if (req.params.milestoneId) {
                const milestone = await Milestone.findById(req.params.milestoneId).populate('projectId');
                 if (!milestone || !milestone.projectId || milestone.projectId.clientId.toString() !== user.clientId._id.toString()) {
                    return res.status(403).json({ msg: 'Access denied. This milestone does not belong to your company\'s projects.' });
                }
            }
            // Add more specific checks for other client-accessible resources (e.g., files, comments)
            // Ensure any resource accessed by a client is checked against their clientId

            return next();
        }

        // If not authenticated or not a recognized role with permission
        return res.status(403).json({ msg: 'Access denied. Insufficient privileges.' });
    } catch (err) {
        console.error('Owner or Admin Middleware Error:', err);
        res.status(500).json({ msg: 'Server error during authorization.' }); // Ensure JSON response
    }
};

// Helper function to send verification email
const sendVerificationEmail = async (user) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        }
    });

    const verificationLink = `${CLIENT_URL}/login?verificationStatus=success&email=${encodeURIComponent(user.email)}`;

    const mailOptions = {
        from: EMAIL_USER,
        to: user.email,
        subject: 'Verify Your Email for Webflare Design Co.',
        html: `
            <p>Hello ${user.name},</p>
            <p>Thank you for registering with Webflare Design Co.!</p>
            <p>Please click on the following link to verify your email address:</p>
            <p><a href="${verificationLink}">Verify My Email</a></p>
            <p>If you did not register for an account, please ignore this email.</p>
            <p>Regards,</p>
            <p>The Webflare Design Co. Team</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', user.email);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email.');
    }
};


// --- API ROUTES ---

// == AUTH & USER MANAGEMENT ==
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Populate clientId for client users to include it in the token payload
        const user = await User.findOne({ email }).populate('clientId', 'name'); // Select only name from Client
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
        
        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(401).json({ msg: 'Please verify your email to log in.', errorCode: 'EMAIL_NOT_VERIFIED', email: user.email });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
        
        // Include clientId in the JWT payload if the user has a client role
        const payload = { 
            id: user.id, 
            role: user.role, 
            clientId: user.role === 'Client' && user.clientId ? user.clientId._id : null 
        };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }, (err, token) => {
            if (err) throw err;
            // Return selected user info including client name if applicable
            res.json({ 
                token, 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email, 
                    role: user.role, 
                    // If client user, include client company name
                    clientCompany: user.clientId ? { _id: user.clientId._id, name: user.clientId.name } : null
                } 
            });
        });
    } catch (err) { res.status(500).send('Server error'); }
});

app.get('/api/auth/user', authMiddleware, async (req, res) => {
    try {
        // Populate clientId for client users to send client company name to frontend
        const user = await User.findById(req.userId).select('-password').populate('clientId', 'name');
        res.json(user);
    } catch (err) { res.status(500).send('Server error'); }
});

app.post('/api/auth/register', authMiddleware, ceoOnlyMiddleware, async (req, res) => {
    try {
        const { name, email, password, role, clientId } = req.body; // clientId can be provided for client users
        
        if (role === 'CEO' || role === 'CTO') {
            const existingRoleHolder = await User.findOne({ role: role });
            if (existingRoleHolder) {
                return res.status(400).json({ msg: `A user with the role ${role} already exists. Only one is allowed.` });
            }
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });
        
        // Validate clientId if role is 'Client'
        if (role === 'Client' && !clientId) {
            return res.status(400).json({ msg: 'Client users must be assigned to a Client company.' });
        }
        if (clientId && !(await Client.findById(clientId))) {
             return res.status(400).json({ msg: 'Invalid Client ID provided.' });
        }

        const emailVerificationToken = crypto.randomBytes(20).toString('hex');

        // Assign clientId to user if their role is 'Client'
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
        
        await sendVerificationEmail(user); // Call the helper function

        const ceo = await User.findOne({ role: 'CEO' });
        const creator = await User.findById(req.userId);
        if (ceo && ceo._id.toString() !== creator._id.toString()) {
            const message = `${creator.name} registered a new user: ${user.name} (${user.role}).`;
            new Notification({ recipient: ceo._id, message, link: `/users` }).save();
        }

        res.status(201).json({ msg: 'User registered successfully. A verification email has been sent to your email address.', userId: user._id });
    } catch (err) { res.status(500).send('Server error'); }
});

// NEW: Resend Email Verification Route (retained)
app.post('/api/auth/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        if (user.isEmailVerified) {
            return res.status(400).json({ msg: 'Email is already verified.' });
        }

        // Generate a new verification token
        const newEmailVerificationToken = crypto.randomBytes(20).toString('hex');
        user.emailVerificationToken = newEmailVerificationToken;
        await user.save();

        await sendVerificationEmail(user); // Resend the email

        res.json({ msg: 'New verification email sent successfully!' });
    } catch (err) {
        console.error('Error resending verification email:', err);
        res.status(500).send('Server error while resending verification email.');
    }
});


// Email verification route (Updated to redirect and for better error logging during save)
app.get('/api/auth/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({ emailVerificationToken: token });

        if (!user) {
            return res.redirect(`${CLIENT_URL}/login?verificationStatus=failed&message=${encodeURIComponent('Invalid or expired verification token.')}`);
        }

        try {
            user.isEmailVerified = true;
            user.emailVerificationToken = undefined; // Clear the token after verification
            await user.save(); // THIS IS THE CRITICAL SAVE OPERATION
            console.log(`User ${user.email} successfully verified!`);
        } catch (saveErr) {
            console.error('Mongoose save error during email verification:', saveErr);
            let errorMessage = 'Failed to update verification status due to a database issue.';
            if (saveErr.name === 'ValidationError') {
                errorMessage = `Validation Error: ${saveErr.message}`;
            }
            return res.redirect(`${CLIENT_URL}/login?verificationStatus=error&message=${encodeURIComponent(errorMessage)}`);
        }

        return res.redirect(`${CLIENT_URL}/login?verificationStatus=success&email=${encodeURIComponent(user.email)}`);
    } catch (err) {
        console.error('General email verification process error:', err);
        return res.redirect(`${CLIENT_URL}/login?verificationStatus=error&message=${encodeURIComponent('An unexpected server error occurred during verification.')}`);
    }
});

app.get('/api/users', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password').populate('clientId', 'name'); // Populate client name
        res.json(users);
    } catch (err) { res.status(500).send('Server error'); }
});

app.put('/api/users/:id', authMiddleware, ceoOnlyMiddleware, async (req, res) => {
    try {
        const { name, email, role, clientId } = req.body; // Include clientId in update

        if (role === 'CEO' || role === 'CTO') {
            const existingRoleHolder = await User.findOne({ role: role, _id: { $ne: req.params.id } });
            if (existingRoleHolder) {
                return res.status(400).json({ msg: `A user with the role ${role} already exists. Only one is allowed.` });
            }
        }
        if (role === 'Client' && !clientId) {
            return res.status(400).json({ msg: 'Client users must be assigned to a Client company.' });
        }
        if (clientId && !(await Client.findById(clientId))) {
             return res.status(400).json({ msg: 'Invalid Client ID provided.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { name, email, role, clientId: role === 'Client' ? clientId : undefined }, // Update clientId based on role
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(updatedUser);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.delete('/api/users/:id', authMiddleware, ceoOnlyMiddleware, async (req, res) => {
    try {
        if (req.params.id === req.userId) {
            return res.status(400).json({ msg: 'You cannot delete your own account.' });
        }
        
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        res.status(500).send('Server error');
    }
});


// == PROJECTS ==

// Get a single project by ID for admin panel
app.get('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.id;

        // Validate if projectId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ msg: 'Invalid Project ID format.' });
        }

        const project = await Project.findById(projectId)
            .populate('clientId', 'name') // Populate client name
            .populate({ // Populate milestones for the project detail view
                path: 'milestones',
                model: 'Milestone',
                populate: { // Optionally populate tasks and assignees within milestones
                    path: 'tasks',
                    model: 'Task',
                    populate: {
                        path: 'assignedTo',
                        model: 'User',
                        select: 'name'
                    }
                }
            });

        if (!project) {
            return res.status(404).json({ msg: 'Project not found.' });
        }
        res.json(project);
    } catch (err) {
        console.error('Error fetching single project:', err);
        res.status(500).json({ msg: 'Server Error fetching project details.' }); // Ensure JSON response
    }
});


// Get ALL projects for the admin panel list view
app.get('/api/projects', authMiddleware, async (req, res) => {
    try {
        const projects = await Project.aggregate([
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'project',
                    as: 'comments'
                }
            },
            {
                $lookup: {
                    from: 'clients',
                    localField: 'clientId', // Use the original clientId from Project
                    foreignField: '_id',
                    as: 'clientDetails'
                }
            },
            { $unwind: { path: '$clientDetails', preserveNullAndEmptyArrays: true } },
            {
                $lookup: { // Lookup Milestones for each project
                    from: 'milestones',
                    localField: '_id',
                    foreignField: 'projectId',
                    as: 'milestones'
                }
            },
            {
                $addFields: {
                    commentCount: { $size: '$comments' },
                    client: '$clientDetails' // This maps the populated client object to a new field 'client'
                }
            },
            { // FIX: Explicitly include _id and other necessary fields in the final projection
                $project: {
                    _id: 1, // Explicitly include the _id
                    title: 1,
                    description: 1,
                    status: 1,
                    imageUrl: 1,
                    isFeatured: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    commentCount: 1,
                    clientId: '$clientId', // Keep the original clientId (the ID from Project document)
                    client: { // Project specific fields to return the populated client details
                        _id: '$clientDetails._id', // Access populated client's _id
                        name: '$clientDetails.name' // Access populated client's name
                    },
                    milestones: 1 // Include populated milestones for the project list if needed, or remove to simplify
                }
            }
        ]);
        res.json(projects);
    } catch (err) {
        console.error('Error fetching all projects (aggregation):', err);
        res.status(500).json({ msg: 'Server Error fetching all projects.' });
    }
});

app.post('/api/projects', authMiddleware, (req, res) => {
    uploadProjectImage(req, res, async (err) => {
        if(err) return res.status(500).json({ msg: err.message });
        const { title, description, status, clientId } = req.body;
        const imageUrl = req.file ? `/public/uploads/${req.file.filename}` : '';
        const newProject = new Project({ title, description, status, clientId, imageUrl });
        try {
            await newProject.save();
            const ceo = await User.findOne({ role: 'CEO' });
            if (ceo) {
                const creator = await User.findById(req.userId);
                const message = `${creator.name} created a new project: "${newProject.title}".`;
                new Notification({ recipient: ceo._id, message, link: `/projects` }).save();
            }
            res.status(201).json(newProject);
        } catch (serverErr) { res.status(500).send('Server error on save'); }
    });
});

app.get('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check for a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ msg: 'Invalid Project ID format.' });
    }

    // 1. Fetch ONLY the project and its immediate client details.
    //    We are no longer populating milestones here, which removes the source of the crash.
    const project = await Project.findById(projectId).populate('clientId', 'name');

    // 2. Check if the project was found
    if (!project) {
      return res.status(404).json({ msg: 'Project not found.' });
    }

    // 3. Send the simplified project object as the response.
    res.json(project);

  } catch (err) {
    // This catch block will now properly handle any errors and send a clean JSON response.
    console.error('Error fetching single project:', err);
    res.status(500).json({ msg: 'Server error while fetching project details.' });
  }
});

app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        // Also delete associated milestones, tasks, files when a project is deleted
        await Milestone.deleteMany({ projectId: req.params.id });
        await Task.deleteMany({ projectId: req.params.id });
        await File.deleteMany({ projectId: req.params.id }); // Assuming files are also tied to project
        res.json({ msg: 'Project removed' });
    } catch (err) { res.status(500).send('Server Error'); }
});

app.put('/api/projects/:id/toggle-feature', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        if (!project.isFeatured) {
            const featuredCount = await Project.countDocuments({ isFeatured: true });
            if (featuredCount >= 5) return res.status(400).json({ msg: 'Cannot feature more than 5 projects.' });
        }
        project.isFeatured = !project.isFeatured;
        await project.save();
        res.json(project);
    } catch (err) { res.status(500).send('Server Error'); }
});

app.get('/api/projects/:projectId/hours', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const totalHoursResult = await TimeEntry.aggregate([
      { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
      { $group: { _id: null, totalHours: { $sum: '$hours' } } }
    ]);

    const totalHours = totalHoursResult.length > 0 ? totalHoursResult[0].totalHours : 0;
    res.json({ totalHours });
  } catch (err) {
    console.error('Error fetching project hours:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});


// == MILESTONES ==
app.post('/api/milestones', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
        const { name, description, projectId, dueDate, status } = req.body;
        const newMilestone = new Milestone({ name, description, projectId, dueDate, status });
        await newMilestone.save();
        res.status(201).json(newMilestone);
    } catch (err) {
        console.error('Error adding milestone:', err);
        res.status(500).send('Server error adding milestone.');
    }
});

app.put('/api/milestones/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
        const { name, description, dueDate, status, clientSuggestions, lastSuggestedBy, lastSuggestionDate } = req.body;
        const updatedMilestone = await Milestone.findByIdAndUpdate(
            req.params.id,
            { name, description, dueDate, status, clientSuggestions, lastSuggestedBy, lastSuggestionDate },
            { new: true }
        );
        if (!updatedMilestone) return res.status(404).json({ msg: 'Milestone not found.' });
        res.json(updatedMilestone);
    } catch (err) {
        console.error('Error updating milestone:', err);
        res.status(500).send('Server error updating milestone.');
    }
});

app.delete('/api/milestones/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
        const milestone = await Milestone.findByIdAndDelete(req.params.id);
        if (!milestone) return res.status(404).json({ msg: 'Milestone not found.' });
        // Optionally, unlink tasks associated with this milestone (set milestoneId to null)
        await Task.updateMany({ milestoneId: req.params.id }, { $unset: { milestoneId: 1 } });
        res.json({ msg: 'Milestone deleted successfully.' });
    } catch (err) {
        console.error('Error deleting milestone:', err);
        res.status(500).send('Server error deleting milestone.');
    }
});


// == CLIENT PORTAL API ROUTES ==
// Get projects for the authenticated client, populated with milestones and tasks
app.get('/api/client/projects', authMiddleware, clientOnlyMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.clientId) {
            return res.status(403).json({ msg: 'Client user not properly associated with a client company.' });
        }

        // Fetch projects belonging to the client's company
        const clientProjects = await Project.find({ clientId: user.clientId })
            .populate('clientId', 'name') // Populate client company name
            .sort({ createdAt: -1 });

        // For each project, fetch its milestones and their tasks separately
        const projectsWithDetails = await Promise.all(clientProjects.map(async (project) => {
            const milestones = await Milestone.find({ projectId: project._id }).sort({ dueDate: 1 });
            const tasks = await Task.find({ projectId: project._id }).populate('assignedTo', 'name'); // Fetch all tasks for the project and populate assignee name

            // Map tasks to their respective milestones
            const milestonesWithTasks = milestones.map(milestone => {
                const tasksForMilestone = tasks.filter(task => task.milestoneId && task.milestoneId.equals(milestone._id));
                return {
                    ...milestone.toObject(),
                    tasks: tasksForMilestone // Attach filtered tasks to the milestone
                };
            });

            return {
                ...project.toObject(),
                milestones: milestonesWithTasks
            };
        }));

        res.json(projectsWithDetails);
    } catch (err) {
        console.error('Error fetching client projects:', err);
        res.status(500).send('Server error fetching client projects.');
    }
});

// Endpoint for client to add suggestions to a milestone
app.put('/api/client/milestones/:milestoneId/suggest', authMiddleware, clientOnlyMiddleware, async (req, res) => {
    try {
        const { suggestion } = req.body;
        const milestoneId = req.params.milestoneId;
        const userId = req.userId;

        const user = await User.findById(userId).populate('clientId');
        if (!user || !user.clientId) {
            return res.status(403).json({ msg: 'Client user not properly associated.' });
        }

        const milestone = await Milestone.findById(milestoneId).populate('projectId');
        if (!milestone) {
            return res.status(404).json({ msg: 'Milestone not found.' });
        }

        // Ensure the milestone belongs to a project owned by this client's company
        if (!milestone.projectId || milestone.projectId.clientId.toString() !== user.clientId._id.toString()) {
            return res.status(403).json({ msg: 'Access denied. This milestone does not belong to your company\'s projects.' });
        }
        
        milestone.clientSuggestions = suggestion;
        milestone.lastSuggestedBy = userId; // Store the user ID of the client who made the suggestion
        milestone.lastSuggestionDate = new Date();
        await milestone.save();

        // Notify relevant internal users (CEO, project manager, assigned dev etc.)
        const projectCreator = await User.findById(milestone.projectId.creator); // Assuming project has a creator field
        const message = `${user.name} (Client) added a suggestion to milestone "${milestone.name}" on project "${milestone.projectId.title}".`;
        
        const ceo = await User.findOne({ role: 'CEO' });
        if (ceo && ceo._id.toString() !== userId.toString()) {
             new Notification({ recipient: ceo._id, message, link: `/projects/${milestone.projectId._id}` }).save();
        }
        if (projectCreator && projectCreator._id.toString() !== userId.toString()) {
            new Notification({ recipient: projectCreator._id, message, link: `/projects/${milestone.projectId._id}` }).save();
        }

        res.json({ msg: 'Suggestion added successfully.', milestone });

    } catch (err) {
        console.error('Error adding client suggestion:', err);
        res.status(500).send('Server error adding suggestion.');
    }
});


// == FILES, COMMENTS, ETC. ==
app.get('/api/projects/:projectId/files', authMiddleware, ownerOrAdminMiddleware, async (req, res) => {
    try {
        const files = await File.find({ projectId: req.params.projectId }).sort({ createdAt: 'desc' });
        res.json(files);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.post('/api/projects/:projectId/files', authMiddleware, adminOnlyMiddleware, (req, res) => { // Admin only for adding files for now
    uploadProjectFile(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ msg: "File upload failed", error: err.message });
        }
        if (req.file === undefined) {
            return res.status(400).json({ msg: 'No file selected' });
        }
        try {
            const { originalname, path: filePath, mimetype, size } = req.file;
            const webPath = `/${filePath.replace(/\\/g, '/')}`;
            const newFile = new File({
                originalName: originalname,
                path: webPath,
                mimetype: mimetype,
                size: size,
                projectId: req.params.projectId,
            });
            await newFile.save();
            res.status(201).json(newFile);
        } catch (serverErr) {
            res.status(500).send('Server error on file save');
        }
    });
});

app.get('/api/projects/:projectId/comments', authMiddleware, ownerOrAdminMiddleware, async (req, res) => {
    try {
        const comments = await Comment.find({ project: req.params.projectId }).sort({ createdAt: 'desc' }).populate('author', 'name');
        res.json(comments);
    } catch (err) { res.status(500).send('Server Error'); }
});

app.post('/api/projects/:projectId/comments', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        const newComment = new Comment({ text: req.body.text, author: req.userId, project: req.params.projectId });
        await newComment.save();
        const author = await User.findById(req.userId);
        const message = `${author.name} commented on project "${project.title}"`;
        const allUsers = await User.find({ _id: { $ne: req.userId } });
        allUsers.forEach(user => { new Notification({ recipient: user._id, message, link: `/projects/${project._id}` }).save(); });
        const populatedComment = await Comment.findById(newComment._id).populate('author', 'name');
        res.status(201).json(populatedComment);
    } catch (err) { res.status(500).send('Server Error'); }
});


// == OTHER ENTITIES (Clients, Tasks, etc.) ==
app.get('/api/clients', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Client.find()));
app.post('/api/clients', authMiddleware, adminOnlyMiddleware, async (req, res) => res.status(201).json(await new Client(req.body).save()));
app.put('/api/clients/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Client.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/clients/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Client.findByIdAndDelete(req.params.id)));

app.get('/api/tasks', authMiddleware, async (req, res) => {
    const userRole = req.userRole ? req.userRole.trim().toUpperCase() : '';
    const query = (userRole === 'CEO') ? {} : { assignedTo: req.userId };
    res.json(await Task.find(query).populate({ path: 'projectId', select: 'title' }).populate({ path: 'assignedTo', select: 'name' }));
});

// ADMIN: Add/Edit/Delete tasks (can link to milestones)
app.post('/api/tasks', authMiddleware, async (req, res) => {
    const task = new Task(req.body);
    await task.save();
    if (task.assignedTo) {
        const author = await User.findById(req.userId);
        const project = await Project.findById(task.projectId);
        const message = `${author.name} assigned you a new task: "${task.title}" for project "${project.title}".`;
        new Notification({ recipient: task.assignedTo, message, link: `/tasks` }).save();
    }
    res.status(201).json(task);
});

app.put('/api/tasks/:taskId', authMiddleware, async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(req.params.taskId, req.body, { new: true });
        if (!updatedTask) return res.status(404).json({ msg: 'Task not found' });
        res.json(updatedTask);
    } catch (err) { res.status(500).send('Server Error'); }
});

app.put('/api/tasks/:taskId/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const updatedTask = await Task.findByIdAndUpdate(req.params.taskId, { status }, { new: true });
        if (!updatedTask) return res.status(404).json({ msg: 'Task not found' });

        const updater = await User.findById(req.userId);

        if (updatedTask.assignedTo && updatedTask.assignedTo.toString() !== updater._id.toString()) {
            const message = `${updater.name} updated the status of your task "${updatedTask.title}" to "${status}".`;
            new Notification({ recipient: updatedTask.assignedTo, message, link: `/tasks` }).save();
        }

        if (status === 'Done') {
            const ceo = await User.findOne({ role: 'CEO' });
            if (ceo && ceo._id.toString() !== updater._id.toString()) {
                 const message = `${updater.name} completed the task: "${updatedTask.title}".`;
                 new Notification({ recipient: ceo._id, message, link: `/tasks` }).save();
            }
        }
        
        res.json(updatedTask);
    } catch (err) { res.status(500).send('Server Error'); }
});

app.post('/api/tasks/:taskId/time', authMiddleware, async (req, res) => {
    try {
        const { hours, description } = req.body;
        const task = await Task.findById(req.params.taskId);
        if (!task) return res.status(404).json({ msg: 'Task not found' });
        const newTimeEntry = new TimeEntry({ hours, description, user: req.userId, task: req.params.taskId, project: task.projectId });
        await newTimeEntry.save();
        res.status(201).json(newTimeEntry);
    } catch (err) { res.status(500).send('Server Error'); }
});


// == FINANCIAL (Invoices, Contracts) ==
app.get('/api/invoices', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Invoice.find().populate({ path: 'projectId', populate: { path: 'clientId' } })));

app.post('/api/invoices', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
        const counter = await Counter.findOneAndUpdate({ _id: 'invoiceNumber' }, { $inc: { sequence_value: 1 } }, { new: true, upsert: true });
        const newInvoiceNumber = `WDC-${String(counter.sequence_value).padStart(4, '0')}`;
        const newInvoice = new Invoice({ ...req.body, invoiceNumber: newInvoiceNumber });
        await newInvoice.save();
        const ceo = await User.findOne({ role: 'CEO' });
        if (ceo) {
            const creator = await User.findById(req.userId);
            const message = `A new invoice (${newInvoice.invoiceNumber}) was created by ${creator.name}.`;
            new Notification({ recipient: ceo._id, message, link: `/invoices` }).save();
        }
        res.status(201).json(newInvoice);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.put('/api/invoices/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/invoices/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Invoice.findByIdAndDelete(req.params.id)));

// Endpoint to send an invoice via email
app.post('/api/invoices/:id/send-email', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate({
            path: 'projectId',
            populate: { path: 'clientId' }
        });

        if (!invoice) {
            return res.status(404).json({ msg: 'Invoice not found.' });
        }
        if (!invoice.projectId || !invoice.projectId.clientId || !invoice.projectId.clientId.email) {
            return res.status(400).json({ msg: 'Client email not found for this invoice.' });
        }

        const clientEmail = invoice.projectId.clientId.email;
        const clientName = invoice.projectId.clientId.name || 'Client';
        const invoiceNumber = invoice.invoiceNumber;
        const invoiceAmount = invoice.amount.toFixed(2);
        const dueDate = new Date(invoice.dueDate).toLocaleDateString();
        const projectName = invoice.projectId.title;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            }
        });

        const mailOptions = {
            from: EMAIL_USER,
            to: clientEmail,
            subject: `Invoice #${invoiceNumber} from Webflare Design Co.`,
            html: `
                <p>Hello ${clientName},</p>
                <p>Please find below the details for your invoice from Webflare Design Co.:</p>
                <ul>
                    <li><strong>Invoice Number:</strong> ${invoiceNumber}</li>
                    <li><strong>Project:</strong> ${projectName}</li>
                    <li><strong>Amount Due:</strong> $${invoiceAmount}</li>
                    <li><strong>Due Date:</strong> ${dueDate}</li>
                    <li><strong>Status:</strong> ${invoice.status}</li>
                </ul>
                <p>You can view your invoice details by logging into your client portal.</p>
                <p>Thank you for your business!</p>
                <p>Regards,</p>
                <p>The Webflare Design Co. Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ msg: `Invoice ${invoiceNumber} sent successfully to ${clientEmail}.` });

    } catch (err) {
        console.error('Error sending invoice email:', err);
        res.status(500).send('Server error sending invoice email.');
    }
});


app.get('/api/contracts', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Contract.find().populate({ path: 'projectId', populate: { path: 'clientId' } })));

app.post('/api/contracts', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    const newContract = await new Contract(req.body).save();
    const ceo = await User.findOne({ role: 'CEO' });
    if (ceo) {
        const creator = await User.findById(req.userId);
        const project = await Project.findById(newContract.projectId);
        const client = await Client.findById(project.clientId);
        const message = `A new contract for ${client.name} (${project.title}) was created by ${creator.name}.`;
        new Notification({ recipient: ceo._id, message, link: `/contracts` }).save();
    }
    res.status(201).json(newContract);
});

app.put('/api/contracts/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/contracts/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Contract.findByIdAndDelete(req.params.id)));


// == REPORTS ==
app.get('/api/reports/time-by-project', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
        const timeReport = await TimeEntry.aggregate([
            {
                $group: {
                    _id: "$project", // Group by project ID
                    totalHours: { $sum: "$hours" } // Sum hours for each project
                }
            },
            {
                $lookup: {
                    from: 'projects', // The collection name for Project model
                    localField: '_id',
                    foreignField: '_id',
                    as: 'projectDetails'
                }
            },
            {
                $unwind: { path: '$projectDetails', preserveNullAndEmptyArrays: true } // Deconstruct the projectDetails array
            },
            {
                $project: {
                    _id: 0, // Exclude the default _id
                    projectId: '$_id', // Rename _id to projectId
                    projectTitle: { $ifNull: ['$projectDetails.title', 'Unknown Project'] }, // Use ifNull to handle potentially missing projectDetails
                    totalHours: '$totalHours'
                }
            },
            { $sort: { projectTitle: 1 } } // Sort by project title
        ]);
        res.json(timeReport);
    } catch (err) {
        console.error('Error fetching time report by project:', err);
        res.status(500).send('Server Error fetching time report by project.');
    }
});

app.get('/api/reports/time-by-user-project', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
        const timeReport = await TimeEntry.aggregate([
            {
                $group: {
                    _id: { user: "$user", project: "$project" }, // Group by user AND project
                    totalHours: { $sum: "$hours" }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id.user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $lookup: {
                    from: 'projects',
                    localField: '_id.project',
                    foreignField: '_id',
                    as: 'projectDetails'
                }
            },
            {
                $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true }
            },
            {
                $unwind: { path: '$projectDetails', preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 0,
                    userId: '$_id.user',
                    userName: { $ifNull: ['$userDetails.name', 'Unknown User'] },
                    projectId: '$_id.project',
                    projectTitle: { $ifNull: ['$projectDetails.title', 'Unknown Project'] },
                    totalHours: '$totalHours'
                }
            },
            { $sort: { userName: 1, projectTitle: 1 } }
        ]);
        res.json(timeReport);
    } catch (err) {
        console.error('Error fetching time report by user and project:', err);
        res.status(500).send('Server Error fetching time report by user and project.');
    }
});

app.get('/api/reports/task-status-summary', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
        const taskStatusSummary = await Task.aggregate([
            {
                $group: {
                    _id: "$status", // Group by task status
                    count: { $sum: 1 } // Count tasks in each status
                }
            },
            {
                $project: {
                    _id: 0, // Exclude default _id
                    status: '$_id', // Rename _id to status
                    count: 1 // Include count
                }
            },
            { $sort: { status: 1 } } // Sort by status
        ]);
        res.json(taskStatusSummary);
    } catch (err) {
        console.error('Error fetching task status summary:', err);
        res.status(500).send('Server Error fetching task status summary.');
    }
});


// == PUBLIC & DASHBOARD ==
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [
            activeProjects,
            pendingTasks,
            unpaidInvoicesResult,
            recentProjects,
            timeEntriesToday
        ] = await Promise.all([
            Project.countDocuments({ status: { $nin: ['Completed', 'Cancelled'] } }),
            Task.countDocuments({ status: { $ne: 'Done' } }),
            Invoice.aggregate([{ $match: { status: { $ne: 'Paid' } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Project.find().sort({ createdAt: -1 }).limit(5).populate('clientId', 'name'),
            TimeEntry.aggregate([
                { $match: { user: new mongoose.Types.ObjectId(req.userId), createdAt: { $gte: today, $lt: tomorrow } }},
                { $group: { _id: null, total: { $sum: '$hours' } } }
            ])
        ]);
        const invoicesDue = unpaidInvoicesResult.length > 0 ? unpaidInvoicesResult[0].total : 0;
        const hoursToday = timeEntriesToday.length > 0 ? timeEntriesToday[0].total : 0;
        res.json({ activeProjects, pendingTasks, invoicesDue, recentProjects, hoursToday });
    } catch (err) { 
        res.status(500).send('Server Error'); 
    }
});

app.get('/api/featured-projects', async (req, res) => {
    try {
        const featured = await Project.find({ isFeatured: true }).limit(5);
        res.json(featured);
    } catch (err) { res.status(500).send('Server Error'); }
});

app.get('/api/services', async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (err) { res.status(500).send('Server Error'); }
});


// == NOTIFICATIONS ==
app.get('/api/notifications', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.userId, isRead: false }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) { res.status(500).send('Server Error'); }
});

app.put('/api/notifications/mark-read', authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.userId, isRead: false }, { isRead: true });
        res.json({ msg: 'Notifications marked as read' });
    } catch (err) { res.status(500).send('Server Error'); }
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});