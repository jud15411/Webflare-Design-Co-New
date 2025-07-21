import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate hook

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('verificationStatus');
    const msg = params.get('message');
    const verifiedEmail = params.get('email');

    if (status === 'success' && verifiedEmail) {
      setSuccessMessage(`Email for ${decodeURIComponent(verifiedEmail)} verified! You can now log in.`);
      setEmail(decodeURIComponent(verifiedEmail));
    } else if (status === 'failed') {
      setError(decodeURIComponent(msg || 'Email verification failed.'));
    }
    // Clean the URL to avoid showing the message on refresh
    if (status) {
      window.history.replaceState({}, document.title, "/login");
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard'); // Use navigate for a smoother, client-side redirect
    } catch (err) {
      setError(err.response?.data?.msg || 'An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/images/Webflare_Design_Co.webp" alt="Webflare Design Co. Logo" className="login-logo" />
        <h2>Developer Gateway</h2>
        {/*
          FIX: The form's onSubmit was pointing to 'handleLogin', but the function is named 'handleSubmit'.
          This has been corrected below.
        */}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {successMessage && <p className="success-message">{successMessage}</p>}
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;