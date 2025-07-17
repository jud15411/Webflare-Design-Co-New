import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
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
import Users from './pages/Users';
import Services from './pages/Services';
import Reports from './pages/Reports'; // Correctly import the Reports component

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
      }
    } catch (error) {
      localStorage.removeItem('token');
    }
  }, []);

  const handleLogin = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedUser = jwtDecode(token);
      setUser(decodedUser);
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
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
      case 'addUser': return <Users />;
      case 'services': return <Services />;
      case 'reports': return <Reports />; // Correctly route to the Reports component
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar user={user} currentPage={currentPage} navigateTo={setCurrentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;