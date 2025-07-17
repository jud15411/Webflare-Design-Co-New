require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Read Environment Variables ---
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

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

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// --- Multer Config ---
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage }).single('projectImage');

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
    if (!['CEO', 'CTO'].includes(req.userRole)) {
        return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }
    next();
};

const ceoOnlyMiddleware = (req, res, next) => {
    if (req.userRole !== 'CEO') {
        return res.status(403).json({ msg: 'Access denied. CEO privileges required.' });
    }
    next();
};

// --- API ROUTES ---

// == AUTH & USER MANAGEMENT ==
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
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
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
});

app.put('/api/auth/user', authMiddleware, async (req, res) => {
    const { name, email } = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.userId, { name, email }, { new: true }).select('-password');
    res.json(updatedUser);
});

app.put('/api/auth/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Incorrect current password' });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ msg: 'Password updated successfully' });
    } catch (err) { res.status(500).send('Server Error'); }
});

app.post('/api/auth/register', authMiddleware, ceoOnlyMiddleware, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });
        user = new User({ name, email, password, role });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        res.status(201).send('User registered successfully');
    } catch (err) { res.status(500).send('Server error'); }
});

app.get('/api/users', authMiddleware, ceoOnlyMiddleware, async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
});

app.put('/api/users/:id/role', authMiddleware, ceoOnlyMiddleware, async (req, res) => {
    const { role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json(updatedUser);
});

app.delete('/api/users/:id', authMiddleware, ceoOnlyMiddleware, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted successfully' });
});

// == DASHBOARD & PUBLIC ROUTES ==
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
    try {
        const [activeProjectsResult, pendingTasksResult, unpaidInvoicesResult, recentProjectsResult] = await Promise.allSettled([
            Project.countDocuments({ status: { $nin: ['Completed', 'Cancelled'] } }),
            Task.countDocuments({ status: { $ne: 'Done' } }),
            Invoice.aggregate([{ $match: { status: { $ne: 'Paid' } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Project.find().sort({ _id: -1 }).limit(5).populate('clientId')
        ]);
        const activeProjects = activeProjectsResult.status === 'fulfilled' ? activeProjectsResult.value : 0;
        const pendingTasks = pendingTasksResult.status === 'fulfilled' ? pendingTasksResult.value : 0;
        const recentProjects = recentProjectsResult.status === 'fulfilled' ? recentProjectsResult.value : [];
        let invoicesDue = 0;
        if (unpaidInvoicesResult.status === 'fulfilled' && unpaidInvoicesResult.value.length > 0) {
            invoicesDue = unpaidInvoicesResult.value[0].total;
        }
        res.json({ activeProjects, pendingTasks, invoicesDue, recentProjects });
    } catch (err) { res.status(500).send('Server Error'); }
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

// == CORE PROTECTED ROUTES ==
// PROJECTS
app.get('/api/projects', async (req, res) => {
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
    upload(req, res, async (err) => {
        if(err) return res.status(500).json({ msg: err });
        const { title, description, status, clientId } = req.body;
        const imageUrl = req.file ? `public/uploads/${req.file.filename}` : '';
        const newProject = new Project({ title, description, status, clientId, imageUrl });
        try {
            await newProject.save();
            res.status(201).json(newProject);
        } catch (serverErr) { res.status(500).send('Server error on save'); }
    });
});
app.put('/api/projects/:id', authMiddleware, (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(500).json({ msg: err });
        try {
            const project = await Project.findById(req.params.id);
            if (!project) return res.status(404).json({ msg: 'Project not found' });
            if (req.file) {
                if (project.imageUrl) fs.unlink(project.imageUrl, (unlinkErr) => { if (unlinkErr) console.error("Error deleting old image:", unlinkErr); });
                project.imageUrl = `public/uploads/${req.file.filename}`;
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
        if (project.imageUrl) fs.unlink(project.imageUrl, (err) => { if (err) console.error("Error deleting image file:", err); });
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

// CLIENTS
app.get('/api/clients', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Client.find()));
app.post('/api/clients', authMiddleware, adminOnlyMiddleware, async (req, res) => res.status(201).json(await new Client(req.body).save()));
app.put('/api/clients/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Client.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/clients/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Client.findByIdAndDelete(req.params.id)));

// TASKS
app.get('/api/tasks', authMiddleware, async (req, res) => res.json(await Task.find().populate({ path: 'projectId', select: 'title' }).populate({ path: 'assignedTo', select: 'name' })));
app.post('/api/tasks', authMiddleware, async (req, res) => {
    const task = new Task(req.body);
    await task.save();
    if (task.assignedTo) {
        const author = await User.findById(req.userId);
        const project = await Project.findById(task.projectId);
        const message = `${author.name} assigned you a new task: "${task.title}" for project "${project.title}"`;
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
        res.json(updatedTask);
    } catch (err) { res.status(500).send('Server Error'); }
});

// INVOICES
app.get('/api/invoices', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Invoice.find().populate({ path: 'projectId', populate: { path: 'clientId' } })));
app.post('/api/invoices', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
        // Find the counter for invoices and increment it
        const counter = await Counter.findOneAndUpdate(
            { _id: 'invoiceNumber' },
            { $inc: { sequence_value: 1 } },
            { new: true, upsert: true } // Create the counter if it doesn't exist
        );

        // Format the new invoice number
        const newInvoiceNumber = `WDC-${String(counter.sequence_value).padStart(4, '0')}`;

        // Create the new invoice with the generated number
        const newInvoice = new Invoice({
            ...req.body,
            invoiceNumber: newInvoiceNumber
        });

        await newInvoice.save();
        res.status(201).json(newInvoice);

    } catch (err) {
        console.error("Error creating invoice:", err);
        res.status(500).send('Server Error');
    }
});
app.put('/api/invoices/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/invoices/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Invoice.findByIdAndDelete(req.params.id)));

// CONTRACTS
app.get('/api/contracts', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Contract.find().populate({ path: 'projectId', populate: { path: 'clientId' } })));
app.post('/api/contracts', authMiddleware, adminOnlyMiddleware, async (req, res) => res.status(201).json(await new Contract(req.body).save()));
app.put('/api/contracts/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/contracts/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => res.json(await Contract.findByIdAndDelete(req.params.id)));

// SERVICES (Management)
app.post('/api/services', authMiddleware, ceoOnlyMiddleware, async (req, res) => { /* ... */ });
app.put('/api/services/:id', authMiddleware, ceoOnlyMiddleware, async (req, res) => { /* ... */ });
app.delete('/api/services/:id', authMiddleware, ceoOnlyMiddleware, async (req, res) => { /* ... */ });

// COMMENTS
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

// TIME TRACKING
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
app.get('/api/reports/time-by-project', authMiddleware, adminOnlyMiddleware, async (req, res) => {
    try {
        const timeReport = await TimeEntry.aggregate([
            { $group: { _id: '$project', totalHours: { $sum: '$hours' } } },
            { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'projectDetails' } },
            { $unwind: '$projectDetails' },
            { $project: { _id: 0, projectId: '$projectDetails._id', projectTitle: '$projectDetails.title', totalHours: 1 } }
        ]);
        res.json(timeReport);
    } catch (err) { res.status(500).send('Server Error'); }
});

// NOTIFICATIONS
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