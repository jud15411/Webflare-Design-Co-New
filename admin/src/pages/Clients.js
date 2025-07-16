import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css';

function Clients() {
  const [clients, setClients] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({ name: '', contactPerson: '', email: '', phone: '' });

  const token = localStorage.getItem('token');

  const fetchClients = useCallback(async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/clients`, { headers: { 'x-auth-token': token }});
    const data = await response.json();
    setClients(data);
  }, [token]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingClient) {
      setEditingClient({ ...editingClient, [name]: value });
    } else {
      setNewClient({ ...newClient, [name]: value });
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    await fetch(`${process.env.REACT_APP_API_URL}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(newClient)
    });
    setShowAddModal(false);
    setNewClient({ name: '', contactPerson: '', email: '', phone: '' });
    fetchClients();
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setShowEditModal(true);
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    await fetch(`${process.env.REACT_APP_API_URL}/api/clients/${editingClient._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(editingClient)
    });
    setShowEditModal(false);
    setEditingClient(null);
    fetchClients();
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client? This may affect associated projects.')) {
      await fetch(`${process.env.REACT_APP_API_URL}/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      fetchClients();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add Client</button>
      </div>
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
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
                  <button className="delete-button" onClick={() => handleDeleteClient(client._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Add New Client</h2><button className="close-button" onClick={() => setShowAddModal(false)}>&times;</button></div>
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
    </div>
  );
}

export default Clients;