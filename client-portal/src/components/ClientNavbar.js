// client-portal/src/components/ClientNavbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Import useAuth
import './ClientNavbar.css'; // We'll create this CSS file next

function ClientNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <nav className="client-navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">Webflare Client Portal</Link>
      </div>
      <div className="navbar-links">
        <span>Welcome, {user?.name || 'Client'}!</span>
        <Link to="/dashboard">My Projects</Link>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
    </nav>
  );
}

export default ClientNavbar;