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
// Define your production URL here, e.g., 'https://www.yourdomain.com'
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
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const adminOnlyMiddleware = (req, res, next) => {
    const userRole = req.userRole ? req.userRole.trim().toUpperCase() : '';
    // ** UPDATED to include SALES role **
    if (!['CEO', 'CTO', 'SALES'].includes(userRole)) {
        return res.status(403).json({ msg: 'Access denied. Privileges required.' });
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

// Helper function to send verification email
const sendVerificationEmail = async (user) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        }
    });

    const verificationLink = `${CLIENT_URL}/api/auth/verify-email?token=${user.emailVerificationToken}`; // Use CLIENT_URL here

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
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
        
        // Check if email is verified
        if (!user.isEmailVerified) {
            // Updated response to indicate unverified email for frontend action
            return res.status(401).json({ msg: 'Please verify your email to log in.', errorCode: 'EMAIL_NOT_VERIFIED', email: user.email });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
        
        const payload = { id: user.id, role: user.role };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) { res.status(500).send('Server error'); }
});

app.get('/api/auth/user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch (err) { res.status(500).send('Server error'); }
});

app.post('/api/auth/register', authMiddleware, ceoOnlyMiddleware, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        if (role === 'CEO' || role === 'CTO') {
            const existingRoleHolder = await User.findOne({ role: role });
            if (existingRoleHolder) {
                return res.status(400).json({ msg: `A user with the role ${role} already exists. Only one is allowed.` });
            }
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });
        
        const emailVerificationToken = crypto.randomBytes(20).toString('hex');

        user = new User({ name, email, password, role, emailVerificationToken });
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

// NEW: Resend Email Verification Route
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
            // Redirect to login with an error indicator if token is invalid/expired
            return res.redirect(`${CLIENT_URL}/login?verificationStatus=failed&message=${encodeURIComponent('Invalid or expired verification token.')}`);
        }

        // Attempt to save the user, with more specific error handling for the save operation
        try {
            user.isEmailVerified = true;
            user.emailVerificationToken = undefined; // Clear the token after verification
            await user.save(); // THIS IS THE CRITICAL SAVE OPERATION
            console.log(`User ${user.email} successfully verified!`);
        } catch (saveErr) {
            // If save fails, log the specific Mongoose error
            console.error('Mongoose save error during email verification:', saveErr);
            // Redirect with a specific message for save failure
            return res.redirect(`${CLIENT_URL}/login?verificationStatus=error&message=${encodeURIComponent('Failed to update verification status due to a database issue.')}`);
        }

        // Redirect to login page with a success indicator
        return res.redirect(`${CLIENT_URL}/login?verificationStatus=success&email=${encodeURIComponent(user.email)}`);
    } catch (err) {
        // Catch any other unexpected errors during the overall process
        console.error('General email verification process error:', err);
        return res.redirect(`${CLIENT_URL}/login?verificationStatus=error&message=${encodeURIComponent('An unexpected server error occurred during verification.')}`);
    }
});

app.get('/api/users', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) { res.status(500).send('Server error'); }
});

app.put('/api/users/:id', authMiddleware, ceoOnlyMiddleware, async (req, res) => {
    try {
        const { name, email, role } = req.body;

        if (role === 'CEO' || role === 'CTO') {
            const existingRoleHolder = await User.findOne({ role: role, _id: { $ne: req.params.id } });
            if (existingRoleHolder) {
                return res.status(400).json({ msg: `A user with the role ${role} already exists. Only one is allowed.` });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { name, email, role }, 
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
app.get('/api/projects', authMiddleware, async (req, res) => {
    try {
        const projects = await Project.aggregate([
            { $lookup: { from: 'comments', localField: '_id', foreignField: 'project', as: 'comments' } },
            { $lookup: { from: 'clients', localField: 'clientId', foreignField: '_id', as: 'clientDetails' } },
            { $unwind: { path: '$clientDetails', preserveNullAndEmptyArrays: true } },
            { $addFields: { commentCount: { $size: '$comments' }, clientId: '$clientDetails' } },
            { $project: { comments: 0, clientDetails: 0 } }
        ]);
        res.json(projects);
    } catch (err) { res.status(500).send('Server Error'); }
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
                const message = `${creator.name} registered a new user: ${newProject.title}.`;
                new Notification({ recipient: ceo._id, message, link: `/projects` }).save();
            }
            res.status(201).json(newProject);
        } catch (serverErr) { res.status(500).send('Server error on save'); }
    });
});

app.put('/api/projects/:id', authMiddleware, (req, res) => {
    uploadProjectImage(req, res, async (err) => {
        if (err) return res.status(500).json({ msg: err.message });
        try {
            const project = await Project.findById(req.params.id);
            if (!project) return res.status(404).json({ msg: 'Project not found' });
            if (req.file) {
                if (project.imageUrl) fs.unlink(path.join(__dirname, project.imageUrl), (unlinkErr) => { if (unlinkErr) console.error("Error deleting old image:", unlinkErr); });
                project.imageUrl = `/public/uploads/${req.file.filename}`;
            }
            project.title = req.body.title;
            project.description = req.body.description;
            project.status = req.body.status;
            project.clientId = req.body.clientId;
            const updatedProject = await project.save();
            res.json(updatedProject);
        } catch (serverErr) { res.status(500).send('Server error on update'); }
    });
});

app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });
        if (project.imageUrl) fs.unlink(path.join(__dirname, project.imageUrl), (err) => { if (err) console.error("Error deleting image file:", err); });
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


// == FILES, COMMENTS, ETC. ==
app.get('/api/projects/:projectId/files', authMiddleware, async (req, res) => {
    try {
        const files = await File.find({ projectId: req.params.projectId }).sort({ createdAt: 'desc' });
        res.json(files);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.post('/api/projects/:projectId/files', authMiddleware, (req, res) => {
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

app.get('/api/projects/:projectId/comments', authMiddleware, async (req, res) => {
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
