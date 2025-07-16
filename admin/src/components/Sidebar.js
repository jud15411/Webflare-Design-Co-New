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
            <a onClick={() => navigateTo('dashboard')}>Dashboard</a>
          </li>
          <li className={currentPage === 'projects' ? 'active' : ''}>
            <a onClick={() => navigateTo('projects')}>Projects</a>
          </li>
          <li className={currentPage === 'clients' ? 'active' : ''}>
            <a onClick={() => navigateTo('clients')}>Clients</a>
          </li>
          <li className={currentPage === 'tasks' ? 'active' : ''}>
            <a onClick={() => navigateTo('tasks')}>Tasks</a>
          </li>
          <li className={currentPage === 'invoices' ? 'active' : ''}>
            <a onClick={() => navigateTo('invoices')}>Invoices</a>
          </li>
          <li className={currentPage === 'contracts' ? 'active' : ''}>
            <a onClick={() => navigateTo('contracts')}>Contracts</a>
          </li>
          <li className={currentPage === 'settings' ? 'active' : ''}>
            <a onClick={() => navigateTo('settings')}>Settings</a>
          </li>
          <li className={currentPage === 'addUser' ? 'active' : ''}>
            <a onClick={() => navigateTo('addUser')}>Users</a>
          </li>
          <li>
            <a onClick={handleLogout} className="nav-link-logout">Log Out</a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;