// client-portal/src/pages/ClientLogin.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Import useAuth from your AuthContext
import './ClientLogin.css'; // We'll create this CSS file next

function ClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // For email verification messages

  const { login, isAuthenticated, user: authUser } = useAuth(); // Destructure login, isAuthenticated, and user from useAuth
  const navigate = useNavigate();
  const location = useLocation();

  // Effect to handle redirection if already authenticated or after external redirects (e.g., email verification)
  useEffect(() => {
    if (isAuthenticated && authUser && authUser.role === 'Client') {
      navigate('/dashboard', { replace: true });
    }

    const params = new URLSearchParams(location.search);
    const verificationStatus = params.get('verificationStatus');
    const message = params.get('message');
    const verifiedEmail = params.get('email');

    if (verificationStatus === 'success') {
      setSuccessMessage(`Email for ${decodeURIComponent(verifiedEmail)} verified successfully! Please log in.`);
    } else if (verificationStatus === 'failed') {
      setError(decodeURIComponent(message || 'Email verification failed. Please try again or contact support.'));
    }
  }, [isAuthenticated, authUser, navigate, location.search]);


  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      // The redirection is now handled by the useEffect hook
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
      console.error("Login error:", err);
    }
  };

  return (
    <div className="client-login-container">
      <div className="client-login-box">
        <img src="/images/Webflare_Design_Co_Logo.webp" alt="Client Portal Logo" className="client-login-logo" />

        <h2>Client Portal Login</h2>
        <form onSubmit={handleLogin}>
          {successMessage && <p className="message-banner success">{successMessage}</p>}
          {error && <p className="message-banner error">{error}</p>}

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="login-button">Log In</button>
        </form>
      </div>
    </div>
  );
}

export default ClientLogin;