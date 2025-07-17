import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './App.css';

// Import components
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail'; // 1. Import ProjectDetail
import Clients from './pages/Clients';
import Tasks from './pages/Tasks';
import Invoices from './pages/Invoices';
import Contracts from './pages/Contracts';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Services from './pages/Services';
import Reports from './pages/Reports';

// A new component for the main, authenticated layout
const AppLayout = ({ user, onLogout }) => (
  <div className="app-layout">
    <Sidebar user={user} onLogout={onLogout} />
    <main className="main-content">
      {/* All protected routes are nested here */}
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 2. Add the specific route for a single project */}
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        
        <Route path="/projects" element={<Projects />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/services" element={<Services />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
        {/* Redirect any other nested path to the dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </main>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        setUser(jwtDecode(token));
      }
    } catch (error) {
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

  if (!isAuthLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {!user ? (
          // --- Render Login page if not authenticated ---
          <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        ) : (
          // --- Render the main AppLayout for all paths if authenticated ---
          <Route path="/*" element={<AppLayout user={user} onLogout={handleLogout} />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;