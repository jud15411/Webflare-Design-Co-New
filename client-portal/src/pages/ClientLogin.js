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
      setError(decodeURIComponent(message || 'Email verification failed. Invalid or expired token.'));
    } else if (verificationStatus === 'error') {
      setError(decodeURIComponent(message || 'An unexpected server error occurred during verification.'));
    }

    // Clean up URL parameters after processing
    window.history.replaceState({}, document.title, location.pathname);
  }, [isAuthenticated, authUser, location, navigate]);


  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage(''); // Clear previous messages on new login attempt

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.errorCode === 'EMAIL_NOT_VERIFIED') {
          setError(data.msg); // "Please verify your email to log in."
          // Optionally, store email for resend option if you add it here
        } else {
          setError(data.msg || 'Login failed.');
        }
        return;
      }
      
      // Check if the logged-in user has the 'Client' role
      if (data.user && data.user.role === 'Client') {
        login(data.user, data.token); // Store user data and token in context
        navigate('/dashboard', { replace: true }); // Redirect to client dashboard
      } else {
        setError('Access denied. This portal is for clients only.');
        // Optionally, log out if a non-client user somehow got a token
        if(data.token) {
            localStorage.removeItem('clientToken');
            localStorage.removeItem('clientUser');
        }
      }

    } catch (err) {
      console.error("Login error:", err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="client-login-container">
      <div className="client-login-box">
        {/* You might want a client portal specific logo here */}
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
        {/* You can add a "Forgot Password" or "Resend Verification" link here if needed */}
      </div>
    </div>
  );
}

export default ClientLogin;