import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css';

function Settings() {
  const [user, setUser] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const token = localStorage.getItem('token');

  // 1. Wrap fetchUserData in useCallback and move it outside of useEffect
  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    try {
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
  }, [token]);

  // 2. Add fetchUserData to the dependency array
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleProfileInputChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };
  
  const handlePasswordInputChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  // 3. Completed the fetch call to save profile changes
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    await fetch(`${process.env.REACT_APP_API_URL}/api/auth/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ name: user.name, email: user.email })
    });
    setProfileMessage('Profile updated successfully!');
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      return setPasswordError('New passwords do not match.');
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      setPasswordError(data.msg);
    } else {
      setPasswordMessage(data.msg);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  if (isLoading) return <div>Loading Settings...</div>;
  if (!user) return <div>Error: Could not load user data.</div>;

  return (
    <div>
      <h1 className="page-title">Settings</h1>

      <div className="data-table-container" style={{maxWidth: '600px', marginBottom: '30px'}}>
        <form onSubmit={handleProfileUpdate}>
          <h3>Update Profile</h3>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={user.name} onChange={handleProfileInputChange} />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={user.email} onChange={handleProfileInputChange} />
          </div>
          <button type="submit" className="add-button">Save Changes</button>
          {profileMessage && <p style={{color: 'green', marginTop: '15px'}}>{profileMessage}</p>}
        </form>
      </div>

      <div className="data-table-container" style={{maxWidth: '600px'}}>
        <form onSubmit={handlePasswordUpdate}>
          <h3>Change Password</h3>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordInputChange} required />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordInputChange} required />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordInputChange} required />
          </div>
          <button type="submit" className="add-button">Change Password</button>
          {passwordMessage && <p style={{color: 'green', marginTop: '15px'}}>{passwordMessage}</p>}
          {passwordError && <p style={{color: 'red', marginTop: '15px'}}>{passwordError}</p>}
        </form>
      </div>
    </div>
  );
}

export default Settings;