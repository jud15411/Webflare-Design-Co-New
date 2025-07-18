import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css'; 

function Users() {
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');

  // States for modal visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFinalDeleteModal, setShowFinalDeleteModal] = useState(false); // State for the second delete modal

  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Developer', clientId: '' });
  
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL;

  const handleCloseModals = useCallback(() => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowFinalDeleteModal(false); // Ensure second modal is also closed
    setSelectedUser(null); 
    setApiError(''); 
    setNewUser({ name: '', email: '', password: '', role: 'Developer', clientId: '' }); 
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [usersRes, clientsRes] = await Promise.all([
        fetch(`${API_URL}/api/users`, { headers: { 'x-auth-token': token } }),
        fetch(`${API_URL}/api/clients`, { headers: { 'x-auth-token': token } })
      ]);
      if (!usersRes.ok || !clientsRes.ok) throw new Error('Failed to fetch data.');
      const usersData = await usersRes.json();
      const clientsData = await clientsRes.json();
      setUsers(usersData);
      setClients(clientsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e, modalType) => {
    const { name, value } = e.target;
    if (modalType === 'add') {
      setNewUser(prev => ({ ...prev, [name]: value }));
    } else {
      setSelectedUser(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setApiError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to add user.');
      handleCloseModals();
      fetchData();
    } catch (err) {
      setApiError(err.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setApiError('');
    try {
      const response = await fetch(`${API_URL}/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(selectedUser),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to update user.');
      handleCloseModals();
      fetchData();
    } catch (err) {
      setApiError(err.message);
    }
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // New function to open the second, final confirmation modal
  const handleProceedToFinalConfirmation = () => {
    setShowDeleteModal(false);
    setShowFinalDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setApiError('');
    try {
      const response = await fetch(`${API_URL}/api/users/${selectedUser._id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to delete user.');
      handleCloseModals();
      fetchData();
    } catch (err) {
      setApiError(err.message);
    }
  };

  if (isLoading) return <div className="loading-message">Loading users...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="users-page">
      <div className="page-header">
        <h1 className="page-title">Manage Users</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add User</button>
      </div>
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Client</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.clientId ? user.clientId.name : 'N/A'}</td>
                <td className="actions-cell">
                  <button className="edit-button" onClick={() => { setSelectedUser(user); setShowEditModal(true); }}>Edit</button>
                  <button className="delete-button" onClick={() => openDeleteModal(user)}>Delete</button>
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
             <div className="modal-header"><h2 className="modal-title">Add New User</h2><button className="close-button" onClick={handleCloseModals}>&times;</button></div>
             {apiError && <div className="error-message">{apiError}</div>}
             <form onSubmit={handleAddUser}>
              <div className="form-group"><label>Name</label><input type="text" name="name" onChange={(e) => handleInputChange(e, 'add')} required /></div>
              <div className="form-group"><label>Email</label><input type="email" name="email" onChange={(e) => handleInputChange(e, 'add')} required /></div>
              <div className="form-group"><label>Password</label><input type="password" name="password" onChange={(e) => handleInputChange(e, 'add')} required /></div>
              <div className="form-group"><label>Role</label><select name="role" value={newUser.role} onChange={(e) => handleInputChange(e, 'add')}><option>Developer</option><option>Project Manager</option><option>Client</option></select></div>
              {newUser.role === 'Client' && (
                <div className="form-group">
                  <label>Client Company</label>
                  <select name="clientId" value={newUser.clientId} onChange={(e) => handleInputChange(e, 'add')} required>
                    <option value="">Select a Client Company</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id}>{client.name}</option>
                    ))}
                  </select>
                </div>
              )}
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
              <div className="form-group"><label>Role</label><select name="role" value={selectedUser.role} onChange={(e) => handleInputChange(e, 'edit')}><option>Developer</option><option>Project Manager</option><option>Client</option></select></div>
              {selectedUser.role === 'Client' && (
                <div className="form-group">
                  <label>Client Company</label>
                  <select name="clientId" value={selectedUser.clientId?._id || ''} onChange={(e) => handleInputChange(e, 'edit')} required>
                    <option value="">Select a Client Company</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id}>{client.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" className="add-button">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* First Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Confirm Deletion</h2><button className="close-button" onClick={handleCloseModals}>&times;</button></div>
            <p>Are you sure you want to delete the user <strong>{selectedUser.name}</strong>?</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={handleCloseModals}>Cancel</button>
              <button className="delete-button" onClick={handleProceedToFinalConfirmation}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Second (Final) Delete Confirmation Modal */}
      {showFinalDeleteModal && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Final Confirmation</h2><button className="close-button" onClick={handleCloseModals}>&times;</button></div>
            {apiError && <div className="error-message">{apiError}</div>}
            <p>Deleting <strong>{selectedUser.name}</strong> is irreversible and the user account cannot be recovered. Do you wish to proceed?</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={handleCloseModals}>Cancel</button>
              <button className="delete-button" onClick={handleDeleteUser}>Proceed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;