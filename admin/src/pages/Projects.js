import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({ title: '', description: '', status: 'Planning', clientId: '' });
  const [projectImage, setProjectImage] = useState(null);

  const token = localStorage.getItem('token');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        fetch('http://localhost:8080/api/projects', { headers: { 'x-auth-token': token } }),
        fetch('http://localhost:8080/api/clients', { headers: { 'x-auth-token': token } })
      ]);

      if (!projectsRes.ok || !clientsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const projectsData = await projectsRes.json();
      const clientsData = await clientsRes.json();
      
      setProjects(projectsData);
      setClients(clientsData);
      setError('');
    } catch (err) {
      setError('Failed to load data. Please check the server connection and log in again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingProject) {
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
    if (projectImage) formData.append('projectImage', projectImage);

    await fetch('http://localhost:8080/api/projects', {
      method: 'POST',
      headers: { 'x-auth-token': token },
      body: formData
    });
    
    setShowAddModal(false);
    setNewProject({ title: '', description: '', status: 'Planning', clientId: '' });
    setProjectImage(null);
    fetchData();
  };
  
  const openEditModal = (project) => {
    setEditingProject(project);
    setShowEditModal(true);
  };
  
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', editingProject.title);
    formData.append('description', editingProject.description);
    formData.append('status', editingProject.status);
    formData.append('clientId', editingProject.clientId._id || editingProject.clientId);
    if (projectImage) formData.append('projectImage', projectImage);

    await fetch(`http://localhost:8080/api/projects/${editingProject._id}`, {
      method: 'PUT',
      headers: { 'x-auth-token': token },
      body: formData
    });
    
    setShowEditModal(false);
    setEditingProject(null);
    setProjectImage(null);
    fetchData();
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await fetch(`http://localhost:8080/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      fetchData();
    }
  };
  
  const handleToggleFeature = async (projectId) => {
    setError('');
    const response = await fetch(`http://localhost:8080/api/projects/${projectId}/toggle-feature`, {
        method: 'PUT',
        headers: { 'x-auth-token': token }
    });
    if (!response.ok) {
        const errData = await response.json();
        setError(errData.msg);
    } else {
        fetchData();
    }
  };

  const featuredCount = projects.filter(p => p.isFeatured).length;
  
  if (isLoading) {
      return <div>Loading projects...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="add-button" onClick={() => { setNewProject({ title: '', description: '', status: 'Planning', clientId: '' }); setShowAddModal(true); }}>+ Add Project</button>
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', borderRadius: '5px', background: error ? '#ffebee' : '#e8f5e9', color: error ? '#c62828' : '#2e7d32' }}>
        {error ? `Error: ${error}` : `You have ${featuredCount} out of 5 featured projects.`}
      </div>
      
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Client</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects && projects.length > 0 ? (
                projects.map(project => (
                  <tr key={project._id}>
                    <td>{project.title}</td>
                    <td>{project.clientId?.name || 'N/A'}</td>
                    <td>{project.status}</td>
                    <td>{project.isFeatured ? 'Yes' : 'No'}</td>
                    <td className="actions-cell">
                      <button className="edit-button" onClick={() => openEditModal(project)}>Edit</button>
                      <button className="delete-button" onClick={() => handleDeleteProject(project._id)}>Delete</button>
                      <button onClick={() => handleToggleFeature(project._id)}>
                        {project.isFeatured ? 'Un-feature' : 'Feature'}
                      </button>
                    </td>
                  </tr>
                ))
            ) : (
                <tr>
                    <td colSpan="5">No projects found. Try adding one!</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add & Edit Modals */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Project</h2>
              <button className="close-button" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddProject}>
              <div className="form-group"><label>Title</label><input type="text" name="title" value={newProject.title} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Client</label><select name="clientId" value={newProject.clientId} onChange={handleInputChange} required><option value="">Select a Client</option>{clients.map(client => (<option key={client._id} value={client._id}>{client.name}</option>))}</select></div>
              <div className="form-group"><label>Description</label><textarea name="description" rows="3" value={newProject.description} onChange={handleInputChange}></textarea></div>
              <div className="form-group"><label>Status</label><select name="status" value={newProject.status} onChange={handleInputChange}><option>Planning</option><option>In Progress</option><option>Pending Review</option><option>Completed</option></select></div>
              <div className="form-group"><label>Project Image</label><input type="file" name="projectImage" onChange={handleImageChange} /></div>
              <button type="submit" className="add-button">Save Project</button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingProject && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Project</h2>
              <button className="close-button" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="form-group"><label>Title</label><input type="text" name="title" value={editingProject.title} onChange={handleInputChange} required /></div>
              <div className="form-group"><label>Client</label><select name="clientId" value={editingProject.clientId?._id} onChange={handleInputChange} required><option value="">Select a Client</option>{clients.map(client => (<option key={client._id} value={client._id}>{client.name}</option>))}</select></div>
              <div className="form-group"><label>Description</label><textarea name="description" rows="3" value={editingProject.description} onChange={handleInputChange}></textarea></div>
              <div className="form-group"><label>Status</label><select name="status" value={editingProject.status} onChange={handleInputChange}><option>Planning</option><option>In Progress</option><option>Pending Review</option><option>Completed</option></select></div>
              <div className="form-group"><label>Update Project Image</label><input type="file" name="projectImage" onChange={handleImageChange} /></div>
              <button type="submit" className="add-button">Update Project</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;