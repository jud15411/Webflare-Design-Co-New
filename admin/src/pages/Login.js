import React, { useState, useEffect } from 'react'; // Import useEffect
import { useLocation } from 'react-router-dom'; // Import useLocation hook
import './Login.css';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // New state for success messages
  const [showResend, setShowResend] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const location = useLocation(); // Initialize useLocation

  // Effect to check for URL parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('verificationStatus');
    const msg = params.get('message');
    const verifiedEmail = params.get('email');

    if (status === 'success') {
      setSuccessMessage(`Email for ${decodeURIComponent(verifiedEmail)} verified successfully! You can now log in.`);
      setEmail(decodeURIComponent(verifiedEmail)); // Pre-fill email field
    } else if (status === 'failed') {
      setError(decodeURIComponent(msg || 'Email verification failed.'));
    } else if (status === 'error') {
      setError(decodeURIComponent(msg || 'An error occurred during email verification. Please try again.'));
    }
    
    // Clear URL parameters to prevent message re-display on refresh
    // This is a simple approach; for more complex apps, use replaceState
    window.history.replaceState({}, document.title, location.pathname);
  }, [location]); // Re-run effect if location changes

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage(''); // Clear messages on new login attempt
    setShowResend(false);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.errorCode === 'EMAIL_NOT_VERIFIED') {
          setError(data.msg);
          setShowResend(true);
          setUnverifiedEmail(email);
        } else {
          setError(data.msg || 'Login failed');
        }
        return;
      }
      
      localStorage.setItem('token', data.token);
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setSuccessMessage(''); // Clear messages on resend attempt
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.msg); // "New verification email sent successfully!"
        setShowResend(false);
      } else {
        setError(data.msg || 'Failed to resend verification email.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        
        <img src="/images/Webflare_Design_Co.webp" alt="Webflare Design Co. Logo" className="login-logo" />

        <h2>Developer Gateway</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {successMessage && <p className="success-message">{successMessage}</p>} {/* Display success message */}
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">Log In</button>
        </form>

        {showResend && (
          <button onClick={handleResendVerification} className="resend-button">
            Resend Verification Email
          </button>
        )}
      </div>
    </div>
  );
}

export default Login;