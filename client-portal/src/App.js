// client-portal/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext'; // Import AuthProvider and useAuth
import ClientLogin from './pages/ClientLogin';
import ClientDashboard from './pages/ClientDashboard';
import ClientProjectDetail from './pages/ClientProjectDetail';
import ClientNavbar from './components/ClientNavbar'; // New Navbar component
import './App.css'; // General app styling

// PrivateRoute component to protect routes that require authentication
function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading application...</div>; // Or a spinner
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

// Separate component to use useAuth hook
function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      {isAuthenticated && <ClientNavbar />} {/* Show navbar only if authenticated */}
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<ClientLogin />} />
          <Route path="/dashboard" element={<PrivateRoute><ClientDashboard /></PrivateRoute>} />
          <Route path="/projects/:projectId" element={<PrivateRoute><ClientProjectDetail /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} /> {/* Redirects to dashboard or login */}
        </Routes>
      </div>
    </div>
  );
}

export default App;