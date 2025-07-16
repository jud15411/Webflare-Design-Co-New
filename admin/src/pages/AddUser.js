import React, { useState } from 'react';
import './AddUser.css'; // We'll create this file next

function AddUser() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Get the admin's token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authorization failed. Please log in again.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token // <-- Attach the admin's token here
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Failed to create user.');
      }

      setMessage(`User "${name}" created successfully!`);
      // Clear the form
      setName('');
      setEmail('');
      setPassword('');

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="page-title">Create a New User</h1>
      <div className="form-container">
        <form onSubmit={handleCreateUser}>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
          
          <button type="submit" className="submit-button">Create User</button>
        </form>
      </div>
    </div>
  );
}

export default AddUser;