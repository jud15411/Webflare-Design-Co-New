import React from 'react';
import './Sidebar.css';

// Accept 'user' as a prop
function Sidebar({ user, currentPage, navigateTo }) {
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
          {user && ['CEO'].includes(user.role) && (
            <li className={currentPage === 'clients' ? 'active' : ''}>
              <button onClick={() => navigateTo('clients')}>Clients</button>
            </li>
          )}
          <li className={currentPage === 'tasks' ? 'active' : ''}>
            <button onClick={() => navigateTo('tasks')}>Tasks</button>
          </li>
          {user && ['CEO', 'CTO'].includes(user.role) && (
            <li className={currentPage === 'invoices' ? 'active' : ''}>
              <button onClick={() => navigateTo('invoices')}>Invoices</button>
            </li>
          )}
          {user && ['CEO', 'CTO'].includes(user.role) && (
            <li className={currentPage === 'contracts' ? 'active' : ''}>
              <button onClick={() => navigateTo('contracts')}>Contracts</button>
            </li>
          )}
          {user && ['CEO'].includes(user.role) && (
            <li className={currentPage === 'user' ? 'active' : ''}>
              <button onClick={() => navigateTo('user')}>Users</button>
            </li>
          )}
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