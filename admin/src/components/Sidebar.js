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
          {/* Use buttons for state changes */}
          <li className={currentPage === 'dashboard' ? 'active' : ''}>
            <button onClick={() => navigateTo('dashboard')}>Dashboard</button>
          </li>
          <li className={currentPage === 'projects' ? 'active' : ''}>
            <button onClick={() => navigateTo('projects')}>Projects</button>
          </li>
          <li className={currentPage === 'clients' ? 'active' : ''}>
            <button onClick={() => navigateTo('clients')}>Clients</button>
          </li>
          {/* ... continue this pattern for all other links ... */}
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