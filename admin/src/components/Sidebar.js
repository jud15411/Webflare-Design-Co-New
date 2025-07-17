import React from 'react';
import './Sidebar.css';

function Sidebar({ user, currentPage, navigateTo }) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  // Check for CEO/CTO level admin access
  const isAdmin = user && ['CEO', 'CTO'].includes(user.role);
  // Check for CEO-only access
  const isCeo = user && user.role === 'CEO';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Webflare Admin</h3>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {/* Links for All Users */}
          <li className={currentPage === 'dashboard' ? 'active' : ''}><button onClick={() => navigateTo('dashboard')}>Dashboard</button></li>
          <li className={currentPage === 'projects' ? 'active' : ''}><button onClick={() => navigateTo('projects')}>Projects</button></li>
          <li className={currentPage === 'tasks' ? 'active' : ''}><button onClick={() => navigateTo('tasks')}>Tasks</button></li>
          
          {/* Admin (CEO & CTO) Links */}
          {isAdmin && (
            <>
              <li className={currentPage === 'clients' ? 'active' : ''}><button onClick={() => navigateTo('clients')}>Clients</button></li>
              <li className={currentPage === 'invoices' ? 'active' : ''}><button onClick={() => navigateTo('invoices')}>Invoices</button></li>
              <li className={currentPage === 'contracts' ? 'active' : ''}><button onClick={() => navigateTo('contracts')}>Contracts</button></li>
            </>
          )}

          {/* CEO Only Links */}
          {isCeo && (
            <>
              <li className={currentPage === 'reports' ? 'active' : ''}><button onClick={() => navigateTo('reports')}>Reports</button></li>
              <li className={currentPage === 'addUser' ? 'active' : ''}><button onClick={() => navigateTo('addUser')}>Users</button></li>
              <li className={currentPage === 'services' ? 'active' : ''}><button onClick={() => navigateTo('services')}>Services</button></li>
            </>
          )}

          {/* Links for All Users */}
          <li className={currentPage === 'settings' ? 'active' : ''}><button onClick={() => navigateTo('settings')}>Settings</button></li>
          <li><button onClick={handleLogout} className="nav-link-logout">Log Out</button></li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;