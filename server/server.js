// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Initialize App
const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/milestones', require('./routes/milestoneRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
// Note: File and Comment routes are nested under projects for context
app.use('/api/projects', require('./routes/fileRoutes')); 
app.use('/api/projects', require('./routes/commentRoutes'));

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});