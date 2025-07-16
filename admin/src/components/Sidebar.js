import React from 'react';
import './Sidebar.css';

function Sidebar({ currentPage, navigateTo }) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Webflare Admin</h3>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className={currentPage === 'dashboard' ? 'active' : ''}>
            <button onClick={() => navigateTo('dashboard')}>Dashboard</button>
          </li>
          <li className={currentPage === 'projects' ? 'active' : ''}>
            <button onClick={() => navigateTo('projects')}>Projects</button>
          </li>
          <li className="currentPage === 'clients' ? 'active' : ''">
            <button onClick={() => navigateTo('clients')}>Clients</button>
          </li>
          <li className={currentPage === 'tasks' ? 'active' : ''}>
            <button onClick={() => navigateTo('tasks')}>Tasks</button>
          </li>
          <li className={currentPage === 'invoices' ? 'active' : ''}>
            <button onClick={() => navigateTo('invoices')}>Invoices</button>
          </li>
          <li className={currentPage === 'contracts' ? 'active' : ''}>
            <button onClick={() => navigateTo('contracts')}>Contracts</button>
          </li>
          <li className={currentPage === 'addUser' ? 'active' : ''}>
            <button onClick={() => navigateTo('addUser')}>Users</button>
          </li>
          <li className={currentPage === 'settings' ? 'active' : ''}>
            <button onClick={() => navigateTo('settings')}>Settings</button>
          </li>
          <li>
            <button onClick={handleLogout} className="nav-link-logout">Log Out</button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;