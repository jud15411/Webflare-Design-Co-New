require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Initialize App & Connect to Database
const app = express();
connectDB();

// === Core Middleware ===
app.use(cors());
app.use(express.json());

// =================================================================
// ## THE FIX: SERVE STATIC FILES FROM THE 'PUBLIC' FOLDER ##
// This line must come BEFORE the API routes and especially before
// the frontend static routes. This ensures that any request for a
// file like /public/uploads/file.svg is handled here first.
// =================================================================
app.use('/public', express.static(path.join(__dirname, 'public')));

// === API Routes ===
// All your API routes are registered after the static file server.
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
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/timeentries', require('./routes/timeEntryRoutes'));


// === Serve Frontend Static Files (for Production) ===
// This section comes last. It's the "catch-all" for any request
// that didn't match a static file or an API route.
if (process.env.NODE_ENV === 'production') {
    // Serve the 'admin' frontend for any path starting with /admin
    app.use('/admin', express.static(path.join(__dirname, '../admin/build')));
    app.get('/admin/*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../admin', 'build', 'index.html'));
    });

    // Serve the 'client' frontend for all other routes
    app.use(express.static(path.join(__dirname, '../client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
    });
}

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});