import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css'; // Reusing shared styles for tables and layout

function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State for modals and selected user
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const token = localStorage.getItem('token');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users`, {
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users. You may not have permission to view this page.');
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

  // --- Modal Handlers ---
  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleOpenDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleCloseModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  // --- API Call Handlers ---
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    await fetch(`${process.env.REACT_APP_API_URL}/api/users/${selectedUser._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
      }),
    });
    
    handleCloseModals();
    fetchUsers(); // Refresh the user list
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    await fetch(`${process.env.REACT_APP_API_URL}/api/users/${selectedUser._id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token },
    });

    handleCloseModals();
    fetchUsers(); // Refresh the user list
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser(prev => ({ ...prev, [name]: value }));
  };


  if (isLoading) return <div>Loading user data...</div>;
  if (error) return <div className="error-message" style={{ padding: '20px' }}>Error: {error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Users</h1>
        <button className="add-button">+ Add User</button>
      </div>

      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td className="actions-cell">
                    <button className="edit-button" onClick={() => handleOpenEditModal(user)}>Edit</button>
                    <button className="delete-button" onClick={() => handleOpenDeleteModal(user)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4">No users found in the system.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit User</h2>
              <button className="close-button" onClick={handleCloseModals}>&times;</button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group"><label>Name</label><input type="text" name="name" value={selectedUser.name} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Email</label><input type="email" name="email" value={selectedUser.email} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Role</label><select name="role" value={selectedUser.role} onChange={handleInputChange} required><option value="Developer">Developer</option><option value="CTO">CTO</option><option value="CEO">CEO</option></select></div>
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