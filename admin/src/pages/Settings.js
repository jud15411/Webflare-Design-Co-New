import React, { useState, useEffect } from 'react';
import './Shared.css';

function Settings() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/user`, {
          headers: { 'x-auth-token': token }
        });
        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    const token = localStorage.getItem('token');
    
    await fetch(`${process.env.REACT_APP_API_URL}/api/auth/user`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ name: user.name, email: user.email })
    });

    setMessage('Profile updated successfully!');
  };

  if (isLoading) {
    return <div>Loading Settings...</div>;
  }
  if (!user) {
    return <div>Error: Could not load user data.</div>;
  }

  return (
    <div>
       <h1 className="page-title">Settings</h1>
       <div className="data-table-container" style={{maxWidth: '600px'}}>
        <form onSubmit={handleUpdate}>
          <h3>Update Profile</h3>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={user.name} onChange={handleInputChange} />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={user.email} onChange={handleInputChange} />
          </div>
          <button type="submit" className="add-button">Save Changes</button>
          {message && <p style={{color: 'green', marginTop: '15px'}}>{message}</p>}
        </form>
       </div>
    </div>
  );
}

export default Settings;