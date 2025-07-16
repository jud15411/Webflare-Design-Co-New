import React, { useState, useEffect, useCallback } from 'react';
import ConfirmModal from '../components/ConfirmModal'; // Import the new modal
import './Shared.css';

function Users() {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Developer' });
  
  const token = localStorage.getItem('token');

  const fetchUsers = useCallback(async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users`, { headers: { 'x-auth-token': token }});
    const data = await response.json();
    setUsers(data);
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(newUser)
    });
    setShowAddModal(false);
    setNewUser({ name: '', email: '', password: '', role: 'Developer' });
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    await fetch(`${process.env.REACT_APP_API_URL}/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ role: newRole })
    });
    fetchUsers();
  };
  
  const openConfirmModal = (user) => {
      setUserToDelete(user);
      setShowConfirmModal(true);
  };
  
  const handleDeleteUser = async () => {
      await fetch(`${process.env.REACT_APP_API_URL}/api/users/${userToDelete._id}`, {
          method: 'DELETE',
          headers: { 'x-auth-token': token }
      });
      setShowConfirmModal(false);
      setUserToDelete(null);
      fetchUsers();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add User</button>
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
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select value={user.role} onChange={(e) => handleRoleChange(user._id, e.target.value)}>
                    <option value="CEO">CEO</option>
                    <option value="CTO">CTO</option>
                    <option value="Developer">Developer</option>
                  </select>
                </td>
                <td className="actions-cell">
                  <button className="delete-button" onClick={() => openConfirmModal(user)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Add New User</h2><button className="close-button" onClick={() => setShowAddModal(false)}>&times;</button></div>
            <form onSubmit={handleAddUser}>
              <div className="form-group"><label>Full Name</label><input type="text" name="name" onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Email</label><input type="email" name="email" onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Password</label><input type="password" name="password" onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Role</label><select name="role" value={newUser.role} onChange={handleInputChange}><option>Developer</option><option>CTO</option><option>CEO</option></select></div>
              <button type="submit" className="add-button">Create User</button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmModal 
            message={`Are you sure you want to delete the user "${userToDelete.name}"? This action cannot be undone.`}
            onConfirm={handleDeleteUser}
            onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
}

export default Users;