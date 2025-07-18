import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css';
import './Services.css'; 

function Services() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // States for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // New state for delete modal

  const [editingService, setEditingService] = useState(null);
  const [deletingServiceId, setDeletingServiceId] = useState(null); // State to hold the ID of the service to delete
  const [newService, setNewService] = useState({ title: '', description: '' });

  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
        const response = await fetch(`${API_URL}/api/services`, {
            headers: { 'x-auth-token': token }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ msg: 'Failed to fetch services' }));
            throw new Error(errorData.msg);
        }
        const data = await response.json();
        setServices(data);
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showEditModal) {
      setEditingService({ ...editingService, [name]: value });
    } else {
      setNewService({ ...newService, [name]: value });
    }
  };
  
  const handleCloseModals = () => {
      setShowAddModal(false);
      setShowEditModal(false);
      setShowDeleteModal(false);
      setEditingService(null);
      setDeletingServiceId(null);
      setNewService({ title: '', description: '' });
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(newService)
    });
    handleCloseModals();
    fetchServices();
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/services/${editingService._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(editingService)
    });
    handleCloseModals();
    fetchServices();
  };
  
  const openDeleteModal = (id) => {
    setDeletingServiceId(id);
    setShowDeleteModal(true);
  };
  
  const confirmDeleteService = async () => {
    if (!deletingServiceId) return;
    await fetch(`${API_URL}/api/services/${deletingServiceId}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    });
    handleCloseModals();
    fetchServices();
  };
  
  const openEditModal = (service) => {
      setEditingService(service);
      setShowEditModal(true);
  };

  if (isLoading) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="services-page">
      <div className="page-header">
        <h1 className="page-title">Manage Services</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add Service</button>
      </div>

      <div className="services-container">
        {services.length > 0 ? (
          services.map(service => (
            <div key={service._id} className="service-card">
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <div className="service-actions">
                <button className="edit-button" onClick={() => openEditModal(service)}>Edit</button>
                <button className="delete-button" onClick={() => openDeleteModal(service._id)}>Delete</button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-data-message">
            <p>No services found. Try adding a new service to display here.</p>
            <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add Your First Service</button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
                <h2 className="modal-title">{showEditModal ? 'Edit Service' : 'Add New Service'}</h2>
                <button className="close-button" onClick={handleCloseModals}>&times;</button>
            </div>
            <form onSubmit={showEditModal ? handleUpdateService : handleAddService}>
              <div className="form-group">
                <label>Service Title</label>
                <input type="text" name="title" value={showEditModal ? editingService.title : newService.title} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" rows="4" value={showEditModal ? editingService.description : newService.description} onChange={handleInputChange} required></textarea>
              </div>
              <button type="submit" className="add-button">{showEditModal ? 'Update Service' : 'Save Service'}</button>
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
              <button className="close-button" onClick={handleCloseModals}>&times;</button>
            </div>
            <p>Are you sure you want to delete this service? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={handleCloseModals}>Cancel</button>
              <button className="delete-button" onClick={confirmDeleteService}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Services;