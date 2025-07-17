import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css'; 

function Users() {
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]); // State to store client companies fetched from backend
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(''); // For general fetch errors
  const [apiError, setApiError] = useState(''); // For API-specific errors (e.g., from user creation/update requests)

  // States for modal visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null); // User object currently being edited/deleted
  // Initial state for new user form, includes clientId
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Developer', clientId: '' });
  
  const token = localStorage.getItem('token'); // Authentication token

  // Resets all modal-related states and clears errors/new user data
  // Wrapped in useCallback for stability
  const handleCloseModals = useCallback(() => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null); 
    setApiError(''); 
    setNewUser({ name: '', email: '', password: '', role: 'Developer', clientId: '' }); 
  }, []); // No dependencies as it only sets state to initial values

  // Handles input changes for both new user and edit user forms
  const handleInputChange = useCallback((e, userType) => {
    const { name, value } = e.target;
    if (userType === 'edit') {
      setSelectedUser(prev => ({ ...prev, [name]: value }));
    } else {
      setNewUser(prev => ({ ...prev, [name]: value }));
    }
  }, []); // No dependencies as it only sets state based on event

  // Fetches both users and client companies. Wrapped in useCallback for stability.
  const fetchUsersAndClients = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [usersResponse, clientsResponse] = await Promise.all([
        // Fetch users, backend populates `clientId` with `_id` and `name` of the Client company
        fetch(`${process.env.REACT_APP_API_URL}/api/users`, { headers: { 'x-auth-token': token } }),
        // Fetch all client companies for the dropdown selection in forms
        fetch(`${process.env.REACT_APP_API_URL}/api/clients`, { headers: { 'x-auth-token': token } })
      ]);

      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users. You may not have permission.');
      }
      if (!clientsResponse.ok) {
        throw new Error('Failed to fetch clients. You may not have permission.');
      }

      const usersData = await usersResponse.json();
      const clientsData = await clientsResponse.json();

      setUsers(usersData);
      setClients(clientsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]); // Dependencies: token. setUsers, setClients, setIsLoading, setError are stable.

  // Effect hook to run fetchData on component mount or when token changes
  useEffect(() => {
    fetchUsersAndClients();
  }, [fetchUsersAndClients]); // Dependency: fetchUsersAndClients (stable reference due to useCallback)

  // --- Handlers for User Actions ---
  // Handles adding a new user. Wrapped in useCallback for stability.
  const handleAddUser = useCallback(async (e) => {
    e.preventDefault();
    setApiError(''); 

    const userToCreate = { ...newUser };
    // If role is not 'Client', ensure clientId is not sent to backend
    if (userToCreate.role !== 'Client') {
      userToCreate.clientId = undefined; 
    }
    // If client role selected but no company is chosen, set clientId to undefined
    if (userToCreate.role === 'Client' && userToCreate.clientId === '') {
        userToCreate.clientId = undefined;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(userToCreate),
      });
      const data = await response.json();
      if (response.ok) {
        handleCloseModals(); 
        fetchUsersAndClients(); 
      } else {
        setApiError(data.msg || 'An unknown error occurred.'); 
      }
    } catch (err) {
      setApiError('A network error occurred. Please check your server connection.');
    }
  }, [newUser, token, handleCloseModals, fetchUsersAndClients]); // Dependencies

  // Handles updating an existing user. Wrapped in useCallback for stability.
  const handleUpdateUser = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setApiError(''); 

    const userToUpdate = { ...selectedUser };
    // If role is not 'Client', ensure clientId is explicitly removed or undefined
    if (userToUpdate.role !== 'Client') {
        userToUpdate.clientId = undefined; 
    }
    // If client role selected but no company chosen (empty string), set to undefined
    if (userToUpdate.role === 'Client' && userToUpdate.clientId === '') {
        userToUpdate.clientId = undefined;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${userToUpdate._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
          name: userToUpdate.name,
          email: userToUpdate.email,
          role: userToUpdate.role,
          clientId: userToUpdate.clientId, // Include clientId for update
        }),
      });
      const data = await response.json();
      if (response.ok) {
        handleCloseModals(); 
        fetchUsersAndClients(); 
      } else {
        setApiError(data.msg || 'An unknown error occurred.'); 
      }
    } catch (err) {
      setApiError('A network error occurred. Please check your server connection.');
    }
  }, [selectedUser, token, handleCloseModals, fetchUsersAndClients]); // Dependencies

  // Handles deleting a user. Wrapped in useCallback for stability.
  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return;
    setApiError(''); 
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${selectedUser._id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (response.ok) {
        handleCloseModals(); 
        fetchUsersAndClients(); 
      } else {
        setApiError(data.msg || 'An unknown error occurred.'); 
      }
    } catch (err) {
        setApiError('A network error occurred. Please check your server connection.');
    }
  }, [selectedUser, token, handleCloseModals, fetchUsersAndClients]); // Dependencies


  // Display loading message
  if (isLoading) return <div>Loading user data...</div>;
  // Display general fetch errors
  if (error) return <div className="error-message" style={{ padding: '20px' }}>Error: {error}</div>;

  return (
    <div>
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
              <th>Client Company</th> {/* New column for client company */}
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
                  <td>{user.clientId ? user.clientId.name : 'N/A'}</td> {/* Display client company name if available */}
                  <td className="actions-cell">
                    <button className="edit-button" onClick={() => { setSelectedUser(user); setShowEditModal(true); }}>Edit</button>
                    <button className="delete-button" onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Add New User</h2><button className="close-button" onClick={handleCloseModals}>&times;</button></div>
            {apiError && <div className="error-message">{apiError}</div>} {/* Display API error for this modal */}
            <form onSubmit={handleAddUser}>
              <div className="form-group"><label>Full Name</label><input type="text" name="name" value={newUser.name} onChange={(e) => handleInputChange(e, 'new')} required /></div>
              <div className="form-group"><label>Email</label><input type="email" name="email" value={newUser.email} onChange={(e) => handleInputChange(e, 'new')} required /></div>
              <div className="form-group"><label>Password</label><input type="password" name="password" value={newUser.password} onChange={(e) => handleInputChange(e, 'new')} required /></div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={newUser.role} onChange={(e) => handleInputChange(e, 'new')} required>
                  <option value="Developer">Developer</option>
                  <option value="Sales">Sales</option>
                  <option value="CTO">CTO</option>
                  <option value="CEO">CEO</option>
                  <option value="Client">Client</option> {/* Added 'Client' role option */}
                </select>
              </div>
              {newUser.role === 'Client' && ( // Conditionally render Client Company dropdown for Client role
                <div className="form-group">
                  <label>Client Company</label>
                  <select name="clientId" value={newUser.clientId} onChange={(e) => handleInputChange(e, 'new')} required>
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
            {apiError && <div className="error-message">{apiError}</div>} {/* Display API error for this modal */}
            <form onSubmit={handleUpdateUser}>
              <div className="form-group"><label>Name</label><input type="text" name="name" value={selectedUser.name} onChange={(e) => handleInputChange(e, 'edit')} required /></div>
              <div className="form-group"><label>Email</label><input type="email" name="email" value={selectedUser.email} onChange={(e) => handleInputChange(e, 'edit')} required /></div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={selectedUser.role} onChange={(e) => handleInputChange(e, 'edit')} required>
                  <option value="Developer">Developer</option>
                  <option value="Sales">Sales</option>
                  <option value="CTO">CTO</option>
                  <option value="CEO">CEO</option>
                  <option value="Client">Client</option> {/* Added 'Client' role option */}
                </select>
              </div>
              {selectedUser.role === 'Client' && ( // Conditionally render Client Company dropdown for Client role
                <div className="form-group">
                  <label>Client Company</label>
                  {/* The value needs to be selectedUser.clientId?._id as it's an object from populate */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Confirm Deletion</h2><button className="close-button" onClick={handleCloseModals}>&times;</button></div>
            {apiError && <div className="error-message">{apiError}</div>} {/* Display API error for this modal */}
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