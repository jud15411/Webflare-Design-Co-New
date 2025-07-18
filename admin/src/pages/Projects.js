import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Shared.css';
import './Projects.css';

function Projects() {
  // State for fetching data and managing errors
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // States for modal visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // New state for delete modal
  
  // State to hold the project being acted upon
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null); // State to hold project ID for deletion

  // States for form inputs
  const [newProject, setNewProject] = useState({ title: '', description: '', status: 'Planning', clientId: '' });
  const [projectImage, setProjectImage] = useState(null);

  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        fetch(`${API_URL}/api/projects`, { headers: { 'x-auth-token': token } }),
        fetch(`${API_URL}/api/clients`, { headers: { 'x-auth-token': token } })
      ]);
      if (!projectsRes.ok || !clientsRes.ok) throw new Error('Failed to fetch necessary data.');
      const projectsData = await projectsRes.json();
      const clientsData = await clientsRes.json();
      setProjects(projectsData);
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

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setEditingProject(null);
    setDeletingProjectId(null);
    setNewProject({ title: '', description: '', status: 'Planning', clientId: '' });
    setProjectImage(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showEditModal) {
      setEditingProject(prev => ({ ...prev, [name]: value }));
    } else {
      setNewProject(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    setProjectImage(e.target.files[0]);
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newProject).forEach(key => formData.append(key, newProject[key]));
    if (projectImage) {
      formData.append('projectImage', projectImage);
    }
    await fetch(`${API_URL}/api/projects`, { method: 'POST', headers: { 'x-auth-token': token }, body: formData });
    handleCloseModals();
    fetchData();
  };
  
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(editingProject).forEach(key => formData.append(key, editingProject[key]));
    if (projectImage) {
        formData.append('projectImage', projectImage);
    }
    await fetch(`${API_URL}/api/projects/${editingProject._id}`, { method: 'PUT', headers: { 'x-auth-token': token }, body: formData });
    handleCloseModals();
    fetchData();
  };

  // Opens the delete confirmation modal
  const openDeleteModal = (id) => {
    setDeletingProjectId(id);
    setShowDeleteModal(true);
  };

  // Performs the actual deletion
  const confirmDeleteProject = async () => {
    if (!deletingProjectId) return;
    await fetch(`${API_URL}/api/projects/${deletingProjectId}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    });
    handleCloseModals();
    fetchData();
  };

  if (isLoading) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="projects-page">
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add Project</button>
      </div>

      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Client</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project._id}>
                <td><Link to={`/projects/${project._id}`}>{project.title}</Link></td>
                <td>{project.client?.name || 'N/A'}</td>
                <td>{project.status}</td>
                <td className="actions-cell">
                  <button className="edit-button" onClick={() => { setEditingProject(project); setShowEditModal(true); }}>Edit</button>
                  <button className="delete-button" onClick={() => openDeleteModal(project._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Project</h2>
              <button className="close-button" onClick={handleCloseModals}>&times;</button>
            </div>
            <form onSubmit={handleAddProject}>
              <div className="form-group"><label>Title</label><input type="text" name="title" onChange={handleInputChange} required /></div>
              <div className="form-group">
                <label>Client</label>
                <select name="clientId" onChange={handleInputChange} required>
                  <option value="">Select a Client</option>
                  {clients.map(client => (<option key={client._id} value={client._id}>{client.name}</option>))}
                </select>
              </div>
              <div className="form-group"><label>Description</label><textarea name="description" rows="3" onChange={handleInputChange}></textarea></div>
              <div className="form-group"><label>Project Image</label><input type="file" name="projectImage" onChange={handleImageChange} /></div>
              <button type="submit" className="add-button">Create Project</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Project</h2>
              <button className="close-button" onClick={handleCloseModals}>&times;</button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="form-group"><label>Title</label><input type="text" name="title" value={editingProject.title} onChange={handleInputChange} required /></div>
              <div className="form-group">
                <label>Client</label>
                <select name="clientId" value={editingProject.clientId?._id || ''} onChange={handleInputChange} required>
                  <option value="">Select a Client</option>
                  {clients.map(client => (<option key={client._id} value={client._id}>{client.name}</option>))}
                </select>
              </div>
              <div className="form-group"><label>Description</label><textarea name="description" rows="3" value={editingProject.description} onChange={handleInputChange}></textarea></div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={editingProject.status} onChange={handleInputChange}>
                  <option>Planning</option><option>In Progress</option><option>Pending Review</option><option>Completed</option>
                </select>
              </div>
              <div className="form-group"><label>Update Project Image</label><input type="file" name="projectImage" onChange={handleImageChange} /></div>
              <button type="submit" className="add-button">Update Project</button>
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
            <p>Are you sure you want to delete this project? All associated data will be removed. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={handleCloseModals}>Cancel</button>
              <button className="delete-button" onClick={confirmDeleteProject}>Delete Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;