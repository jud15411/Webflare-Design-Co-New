import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import Contracts from './pages/Contracts';
import Services from './pages/Services';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import './App.css';

// This component protects routes that require authentication
const PrivateRoute = ({ isAuthenticated, children }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  // State to track if the user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for token in localStorage on initial app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Handler for successful login
  const handleLogin = () => {
    setIsAuthenticated(true);
  };
  
  // Handler for logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  // Don't render anything until we've checked for the token
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        {/* Conditionally render the Sidebar */}
        {isAuthenticated && <Sidebar handleLogout={handleLogout} />}
        
        <div className={isAuthenticated ? "main-content" : "main-content-full"}>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={!isAuthenticated ? <Login onLoginSuccess={handleLogin} /> : <Navigate to="/dashboard" />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<PrivateRoute isAuthenticated={isAuthenticated}><Dashboard /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute isAuthenticated={isAuthenticated}><Projects /></PrivateRoute>} />
            <Route path="/projects/:id" element={<PrivateRoute isAuthenticated={isAuthenticated}><ProjectDetail /></PrivateRoute>} />
            <Route path="/tasks" element={<PrivateRoute isAuthenticated={isAuthenticated}><Tasks /></PrivateRoute>} />
            <Route path="/users" element={<PrivateRoute isAuthenticated={isAuthenticated}><Users /></PrivateRoute>} />
            <Route path="/clients" element={<PrivateRoute isAuthenticated={isAuthenticated}><Clients /></PrivateRoute>} />
            <Route path="/invoices" element={<PrivateRoute isAuthenticated={isAuthenticated}><Invoices /></PrivateRoute>} />
            <Route path="/contracts" element={<PrivateRoute isAuthenticated={isAuthenticated}><Contracts /></PrivateRoute>} />
            <Route path="/services" element={<PrivateRoute isAuthenticated={isAuthenticated}><Services /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute isAuthenticated={isAuthenticated}><Reports /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute isAuthenticated={isAuthenticated}><Settings /></PrivateRoute>} />
            
            {/* Redirect root path */}
            <Route path="/" element={<Navigate replace to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;