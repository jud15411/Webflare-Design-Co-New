import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import Notifications from './Notifications';

function Sidebar({ user, onLogout }) {
  
  const isAdmin = user && ['CEO', 'CTO'].includes(user.role);
  const isCeo = user && user.role === 'CEO';
  // ** NEW: Check for Sales role **
  const isSales = user && user.role === 'Sales';

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
          
          {/* Show Tasks only if NOT a salesperson */}
          {!isSales && <li><NavLink to="/tasks">Tasks</NavLink></li>}
          
          {/* Links for Admin (CEO/CTO) & Sales */}
          {(isAdmin || isSales) && (
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