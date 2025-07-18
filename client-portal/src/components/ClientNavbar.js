// client-portal/src/components/ClientNavbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './ClientNavbar.css';

function ClientNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="client-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard">Webflare</Link>
        </div>
        <div className="navbar-links">
          <span className="welcome-message">Welcome, {user?.name || 'Client'}</span>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default ClientNavbar;