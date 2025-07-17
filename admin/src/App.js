import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './App.css';

// Import components
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Clients from './pages/Clients';
import Tasks from './pages/Tasks';
import Invoices from './pages/Invoices';
import Contracts from './pages/Contracts';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Services from './pages/Services';
import Reports from './pages/Reports';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Ensure token is not expired, etc. before decoding
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
      }
    } catch (error) {
      // If token is invalid or expired, remove it
      localStorage.removeItem('token');
    } finally {
      setIsAuthLoaded(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser(jwtDecode(token));
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Wait until authentication status is determined before rendering
  if (!isAuthLoaded) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <Router>
      <div className="app-layout">
        {/* The Sidebar is now rendered alongside the routes and will show/hide based on user state */}
        {user && <Sidebar user={user} onLogout={handleLogout} />}
        
        <main className="main-content">
          <Routes>
            {!user ? (
              // --- Public Routes ---
              <>
                <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
                {/* Redirect any other path to /login if not authenticated */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              // --- Protected Routes ---
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="/services" element={<Services />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/users" element={<Users />} />
                <Route path="/settings" element={<Settings />} />

                {/* Redirect from root or /login to /dashboard when logged in */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;