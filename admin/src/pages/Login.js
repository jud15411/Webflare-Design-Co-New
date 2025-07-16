import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) { // Accept the onLogin prop
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Login failed');
      
      localStorage.setItem('token', data.token);
      
      onLogin(); // Call the onLogin function passed from App.js
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Add your logo here */}
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
      </div>
    </div>
  );
}

export default Login;