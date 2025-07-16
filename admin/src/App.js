import React, { useState } from 'react';
import './App.css';

// Import all page components
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Clients from './pages/Clients';
import Tasks from './pages/Tasks';
import Invoices from './pages/Invoices';
import Contracts from './pages/Contracts';
import Settings from './pages/Settings';
import AddUser from './pages/AddUser';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const token = localStorage.getItem('token');

  if (!token) {
    return <Login />;
  }

  // Render the correct page based on the state
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'projects': return <Projects />;
      case 'clients': return <Clients />;
      case 'tasks': return <Tasks />;
      case 'invoices': return <Invoices />;
      case 'contracts': return <Contracts />;
      case 'settings': return <Settings />;
      case 'addUser': return <AddUser />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar currentPage={currentPage} navigateTo={setCurrentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;