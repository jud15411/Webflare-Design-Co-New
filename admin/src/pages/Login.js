import React, { useState } from 'react';
import './Login.css'; // Make sure this path is correct

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false); // New state to control resend visibility
  const [unverifiedEmail, setUnverifiedEmail] = useState(''); // New state to store email for resend

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setShowResend(false); // Hide resend option on new login attempt

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.errorCode === 'EMAIL_NOT_VERIFIED') {
          setError(data.msg); // Display the unverified message
          setShowResend(true); // Show the resend button
          setUnverifiedEmail(email); // Store the email for resending
        } else {
          setError(data.msg || 'Login failed'); // Handle other login errors
        }
        return; // Stop execution if login failed
      }
      
      localStorage.setItem('token', data.token);
      onLoginSuccess(); // Call the onLoginSuccess function passed from App.js
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResendVerification = async () => {
    setError(''); // Clear previous errors
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }), // Use the stored unverified email
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.msg); // E.g., "New verification email sent successfully!"
        setShowResend(false); // Hide resend option after successful resend
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
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">Log In</button>
        </form>

        {showResend && ( // Conditionally render the resend button
          <button onClick={handleResendVerification} className="resend-button">
            Resend Verification Email
          </button>
        )}
      </div>
    </div>
  );
}

export default Login;