const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

<<<<<<< HEAD
// Enable CORS
app.use(cors());

// API routes
=======
// =================================================================
// ## THE FIX: SERVE STATIC FILES FIRST ##
// This line must come BEFORE the API routes and especially before
// the frontend static routes to ensure that any request for a file
// in the /public directory is handled here.
// =================================================================
app.use('/public', express.static(path.join(__dirname, 'public')));


// === API Routes ===
>>>>>>> parent of 0e2507e (big update)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
<<<<<<< HEAD
app.use('/api/time-entries', require('./routes/timeEntryRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
=======
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
// Note: Nested routes are handled within projectRoutes.js
>>>>>>> parent of 0e2507e (big update)

// Comment out the static file serving for front-end applications
/*
app.use(express.static(path.join(__dirname, '../client/build')));
app.use(express.static(path.join(__dirname, '../admin/build')));
app.use(express.static(path.join(__dirname, '../client-portal/build')));

<<<<<<< HEAD
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
=======
// === Serve Frontend Static Files (for Production) ===
if (process.env.NODE_ENV === 'production') {
    // Serve the 'admin' frontend build for any path starting with /admin
    app.use('/admin', express.static(path.join(__dirname, '../admin/build')));
    app.get('/admin/*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../admin', 'build', 'index.html'));
    });

    // Serve the 'client' frontend build for all other routes
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
>>>>>>> parent of 0e2507e (big update)
