import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css'; // Assuming this has shared modal styles

function Clients() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // States for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // New state for delete modal
  
  const [editingClient, setEditingClient] = useState(null);
  const [deletingClientId, setDeletingClientId] = useState(null); // State to hold the ID of the client to delete
  const [newClient, setNewClient] = useState({ name: '', contactPerson: '', email: '', phone: '' });

  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/clients`, { headers: { 'x-auth-token': token }});
      if (!response.ok) throw new Error('Failed to fetch clients.');
      const data = await response.json();
      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showEditModal) {
      setEditingClient({ ...editingClient, [name]: value });
    } else if (showAddModal) {
      setNewClient({ ...newClient, [name]: value });
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(newClient)
    });
    setShowAddModal(false);
    setNewClient({ name: '', contactPerson: '', email: '', phone: '' });
    fetchClients();
  };
  
  const handleUpdateClient = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/clients/${editingClient._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(editingClient)
    });
    setShowEditModal(false);
    setEditingClient(null);
    fetchClients();
  };

  const openDeleteModal = (id) => {
    setDeletingClientId(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeletingClientId(null);
    setShowDeleteModal(false);
  };

  const confirmDeleteClient = async () => {
    if (!deletingClientId) return;
    await fetch(`${API_URL}/api/clients/${deletingClientId}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token },
    });
    closeDeleteModal();
    fetchClients();
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setShowEditModal(true);
  };

  if (isLoading) return <div className="loading-message">Loading clients...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1 className="page-title">Manage Clients</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add Client</button>
      </div>

      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Contact Person</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client._id}>
                <td>{client.name}</td>
                <td>{client.contactPerson}</td>
                <td>{client.email}</td>
                <td>{client.phone}</td>
                <td className="actions-cell">
                  <button className="edit-button" onClick={() => openEditModal(client)}>Edit</button>
                  <button className="delete-button" onClick={() => openDeleteModal(client._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Client</h2>
              <button className="close-button" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddClient}>
              <div className="form-group"><label>Company Name</label><input type="text" name="name" onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Contact Person</label><input type="text" name="contactPerson" onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Email</label><input type="email" name="email" onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Phone</label><input type="text" name="phone" onChange={handleInputChange} /></div>
              <button type="submit" className="add-button">Save Client</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && editingClient && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Edit Client</h2><button className="close-button" onClick={() => setShowEditModal(false)}>&times;</button></div>
            <form onSubmit={handleUpdateClient}>
              <div className="form-group"><label>Company Name</label><input type="text" name="name" value={editingClient.name} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Contact Person</label><input type="text" name="contactPerson" value={editingClient.contactPerson} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Email</label><input type="email" name="email" value={editingClient.email} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Phone</label><input type="text" name="phone" value={editingClient.phone} onChange={handleInputChange} /></div>
              <button type="submit" className="add-button">Update Client</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Confirm Deletion</h2>
              <button className="close-button" onClick={closeDeleteModal}>&times;</button>
            </div>
            <p>Are you sure you want to delete this client? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={closeDeleteModal}>Cancel</button>
              <button className="delete-button" onClick={confirmDeleteClient}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;