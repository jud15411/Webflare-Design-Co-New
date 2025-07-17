import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css'; 

function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');

  // State for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Developer' });
  
  const token = localStorage.getItem('token');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users`, {
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users. You may not have permission.');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
    setApiError('');
    setNewUser({ name: '', email: '', password: '', role: 'Developer' });
  };

  // --- Handlers for User Actions (with updated error handling) ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    setApiError('');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      if (response.ok) {
        handleCloseModals();
        fetchUsers();
      } else {
        setApiError(data.msg || 'An unknown error occurred.');
      }
    } catch (err) {
      setApiError('A network error occurred. Please check your server connection.');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setApiError('');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        handleCloseModals();
        fetchUsers();
      } else {
        setApiError(data.msg || 'An unknown error occurred.');
      }
    } catch (err) {
      setApiError('A network error occurred. Please check your server connection.');
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/users/${selectedUser._id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });
      handleCloseModals();
      fetchUsers();
    } catch (err) {
        setApiError('A network error occurred. Please check your server connection.');
    }
  };

  const handleInputChange = (e, userType) => {
    const { name, value } = e.target;
    if (userType === 'edit') {
      setSelectedUser(prev => ({ ...prev, [name]: value }));
    } else {
      setNewUser(prev => ({ ...prev, [name]: value }));
    }
  };

  if (isLoading) return <div>Loading user data...</div>;
  if (error) return <div className="error-message" style={{ padding: '20px' }}>Error: {error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Users</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add User</button>
      </div>

      <div className="data-table-container">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td className="actions-cell">
                    <button className="edit-button" onClick={() => { setSelectedUser(user); setShowEditModal(true); }}>Edit</button>
                    <button className="delete-button" onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Add New User</h2><button className="close-button" onClick={handleCloseModals}>&times;</button></div>
            {apiError && <div className="error-message">{apiError}</div>}
            <form onSubmit={handleAddUser}>
              <div className="form-group"><label>Full Name</label><input type="text" name="name" value={newUser.name} onChange={(e) => handleInputChange(e, 'new')} required /></div>
              <div className="form-group"><label>Email</label><input type="email" name="email" value={newUser.email} onChange={(e) => handleInputChange(e, 'new')} required /></div>
              <div className="form-group"><label>Password</label><input type="password" name="password" value={newUser.password} onChange={(e) => handleInputChange(e, 'new')} required /></div>
              <div className="form-group"><label>Role</label><select name="role" value={newUser.role} onChange={(e) => handleInputChange(e, 'new')} required><option value="Developer">Developer</option><option value="Sales">Sales</option><option value="CTO">CTO</option><option value="CEO">CEO</option></select></div>
              <button type="submit" className="add-button">Create User</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Edit User</h2><button className="close-button" onClick={handleCloseModals}>&times;</button></div>
            {apiError && <div className="error-message">{apiError}</div>}
            <form onSubmit={handleUpdateUser}>
              <div className="form-group"><label>Name</label><input type="text" name="name" value={selectedUser.name} onChange={(e) => handleInputChange(e, 'edit')} required /></div>
              <div className="form-group"><label>Email</label><input type="email" name="email" value={selectedUser.email} onChange={(e) => handleInputChange(e, 'edit')} required /></div>
              <div className="form-group"><label>Role</label><select name="role" value={selectedUser.role} onChange={(e) => handleInputChange(e, 'edit')} required><option value="Developer">Developer</option><option value="Sales">Sales</option><option value="CTO">CTO</option><option value="CEO">CEO</option></select></div>
              <button type="submit" className="add-button">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Confirm Deletion</h2><button className="close-button" onClick={handleCloseModals}>&times;</button></div>
            <p>Are you sure you want to delete the user <strong>{selectedUser.name}</strong>? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={handleCloseModals}>Cancel</button>
              <button className="delete-button" onClick={handleDeleteUser}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;