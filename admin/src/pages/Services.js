import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css';

function Services() {
  const [services, setServices] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({ title: '', description: '' });

  const token = localStorage.getItem('token');

  const fetchServices = useCallback(async () => {
    // This route is protected, so we need the token
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/services`, {
      headers: { 'x-auth-token': token }
    });
    const data = await response.json();
    setServices(data);
  }, [token]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingService) {
      setEditingService({ ...editingService, [name]: value });
    } else {
      setNewService({ ...newService, [name]: value });
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    await fetch(`${process.env.REACT_APP_API_URL}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(newService)
    });
    setShowAddModal(false);
    setNewService({ title: '', description: '' });
    fetchServices();
  };
  
  const openEditModal = (service) => {
    setEditingService(service);
    setShowEditModal(true);
  };
  
  const handleUpdateService = async (e) => {
    e.preventDefault();
    await fetch(`${process.env.REACT_APP_API_URL}/api/services/${editingService._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(editingService)
    });
    setShowEditModal(false);
    setEditingService(null);
    fetchServices();
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      await fetch(`${process.env.REACT_APP_API_URL}/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      fetchServices();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Services</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add Service</button>
      </div>
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service._id}>
                <td>{service.title}</td>
                <td>{service.description}</td>
                <td className="actions-cell">
                  <button className="edit-button" onClick={() => openEditModal(service)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDeleteService(service._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add & Edit Modals */}
      {(showAddModal || (showEditModal && editingService)) && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">{showEditModal ? 'Edit Service' : 'Add New Service'}</h2><button className="close-button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>&times;</button></div>
            <form onSubmit={showEditModal ? handleUpdateService : handleAddService}>
              <div className="form-group"><label>Service Title</label><input type="text" name="title" value={showEditModal ? editingService.title : newService.title} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Description</label><textarea name="description" rows="4" value={showEditModal ? editingService.description : newService.description} onChange={handleInputChange} required></textarea></div>
              <button type="submit" className="add-button">{showEditModal ? 'Update Service' : 'Save Service'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Services;