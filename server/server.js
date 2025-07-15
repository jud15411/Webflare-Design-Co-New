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
const MONGO_URI = process.env.MONGO_URI; // <-- THIS WAS THE MISSING LINE

// --- Initialize App & Models ---
const app = express();
const PORT = process.env.PORT || 8080;
const User = require('./models/User');
const Project = require('./models/Project');
const Client = require('./models/Client');
const Task = require('./models/Task');
const Invoice = require('./models/Invoice');
const Contract = require('./models/Contract');

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
// This line will now work correctly
mongoose.connect(MONGO_URI).then(() => console.log("MongoDB Connected!")).catch(err => console.error(err));

// --- Auth Middleware ---
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET );
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// --- API ROUTES ---

// AUTH
app.post('/api/auth/register', authMiddleware, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    user = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (err) { res.status(500).send('Server error'); }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
        const payload = { id: user.id };
        jwt.sign(payload, JWT_SECRET , { expiresIn: '8h' }, (err, token) => {
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

// DASHBOARD
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

// FEATURED PROJECTS
app.get('/api/featured-projects', async (req, res) => {
    try {
        const featured = await Project.find({ isFeatured: true }).limit(5);
        res.json(featured);
    } catch (err) { res.status(500).send('Server Error'); }
});

// PROJECTS
app.get('/api/projects', authMiddleware, async (req, res) => res.json(await Project.find().populate('clientId')));
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
app.get('/api/clients', authMiddleware, async (req, res) => res.json(await Client.find()));
app.post('/api/clients', authMiddleware, async (req, res) => res.status(201).json(await new Client(req.body).save()));
app.put('/api/clients/:id', authMiddleware, async (req, res) => res.json(await Client.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/clients/:id', authMiddleware, async (req, res) => res.json(await Client.findByIdAndDelete(req.params.id)));

// TASKS
app.get('/api/tasks', authMiddleware, async (req, res) => res.json(await Task.find().populate({ path: 'projectId', select: 'title' })));
app.post('/api/tasks', authMiddleware, async (req, res) => res.status(201).json(await new Task(req.body).save()));
app.put('/api/tasks/:taskId/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const updatedTask = await Task.findByIdAndUpdate(req.params.taskId, { status }, { new: true });
        if (!updatedTask) return res.status(404).json({ msg: 'Task not found' });
        res.json(updatedTask);
    } catch (err) { res.status(500).send('Server Error'); }
});

// INVOICES
app.get('/api/invoices', authMiddleware, async (req, res) => res.json(await Invoice.find().populate({ path: 'projectId', populate: { path: 'clientId' } })));
app.post('/api/invoices', authMiddleware, async (req, res) => res.status(201).json(await new Invoice(req.body).save()));
app.put('/api/invoices/:id', authMiddleware, async (req, res) => res.json(await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/invoices/:id', authMiddleware, async (req, res) => res.json(await Invoice.findByIdAndDelete(req.params.id)));

// CONTRACTS
app.get('/api/contracts', authMiddleware, async (req, res) => res.json(await Contract.find().populate({ path: 'projectId', populate: { path: 'clientId' } })));
app.post('/api/contracts', authMiddleware, async (req, res) => res.status(201).json(await new Contract(req.body).save()));
app.put('/api/contracts/:id', authMiddleware, async (req, res) => res.json(await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/contracts/:id', authMiddleware, async (req, res) => res.json(await Contract.findByIdAndDelete(req.params.id)));

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});