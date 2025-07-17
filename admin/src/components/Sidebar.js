import React from 'react';
import { NavLink } from 'react-router-dom'; // Import NavLink
import './Sidebar.css';
import Notifications from './Notifications';

// The onLogout prop is now used to handle logging out
function Sidebar({ user, onLogout }) {
  
  // Check for CEO/CTO level admin access
  const isAdmin = user && ['CEO', 'CTO'].includes(user.role);
  // Check for CEO-only access
  const isCeo = user && user.role === 'CEO';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Webflare Admin</h3>
        <Notifications />
      </div>
      <nav className="sidebar-nav">
        <ul>
          {/* Links for All Users */}
          <li><NavLink to="/dashboard">Dashboard</NavLink></li>
          <li><NavLink to="/projects">Projects</NavLink></li>
          <li><NavLink to="/tasks">Tasks</NavLink></li>
          
          {/* Admin (CEO & CTO) Links */}
          {isAdmin && (
            <>
              <li><NavLink to="/clients">Clients</NavLink></li>
              <li><NavLink to="/invoices">Invoices</NavLink></li>
              <li><NavLink to="/contracts">Contracts</NavLink></li>
            </>
          )}

          {/* CEO Only Links */}
          {isCeo && (
            <>
              <li><NavLink to="/reports">Reports</NavLink></li>
              <li><NavLink to="/users">Users</NavLink></li>
              <li><NavLink to="/services">Services</NavLink></li>
            </>
          )}

          {/* Links for All Users */}
          <li><NavLink to="/settings">Settings</NavLink></li>
          <li><button onClick={onLogout} className="nav-link-logout">Log Out</button></li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;