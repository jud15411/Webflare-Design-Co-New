import React, { useState, useEffect } from 'react'; // Import useEffect
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
import AddUser from './pages/AddUser';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // On initial load, check for a token and decode it
    const token = localStorage.getItem('token');
    try {
      if (token) {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
      }
    } catch (error) {
      // If token is invalid or expired, clear it
      localStorage.removeItem('token');
    }
  }, []);

  // This function will be passed to the Login component
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
      case 'addUser': return <AddUser />;
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