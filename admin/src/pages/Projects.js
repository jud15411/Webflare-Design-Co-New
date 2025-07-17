import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Shared.css';
import './Projects.css';

function Projects() {
  // State for fetching data and managing errors
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]); // List of client companies
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(''); // For general fetch errors or API errors

  // States for modal visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  // State to hold the project being edited (or selected for any action)
  const [editingProject, setEditingProject] = useState(null); // This is the variable in question
  
  // States for form inputs
  const [newProject, setNewProject] = useState({ title: '', description: '', status: 'Planning', clientId: '' });
  const [projectImage, setProjectImage] = useState(null);

  const token = localStorage.getItem('token'); // Auth token from local storage

  // Fetches both projects and client companies. Wrapped in useCallback for stability.
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/projects`, { headers: { 'x-auth-token': token } }),
        fetch(`${process.env.REACT_APP_API_URL}/api/clients`, { headers: { 'x-auth-token': token } })
      ]);
      if (!projectsRes.ok || !clientsRes.ok) {
        const projectsErrorData = await projectsRes.json().catch(() => ({ msg: 'Unknown error fetching projects' }));
        const clientsErrorData = await clientsRes.json().catch(() => ({ msg: 'Unknown error fetching clients' }));
        throw new Error(projectsErrorData.msg || clientsErrorData.msg || 'Failed to fetch data');
      }
      const projectsData = await projectsRes.json();
      const clientsData = await clientsRes.json();
      setProjects(projectsData);
      setClients(clientsData);

      // console.log('Fetched projects data:', projectsData); // Debugging line for previous issue

    } catch (err) {
      console.error("Error fetching data in Projects.js:", err);
      setError(err.message || 'Error loading projects.');
    } finally {
      setIsLoading(false);
    }
  }, [token]); // Dependencies: token

  // Effect hook to run fetchData on component mount or when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Dependency: fetchData (stable reference due to useCallback)

  // Handles input changes for new/edit project forms. Wrapped in useCallback.
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (showAddModal) {
      setNewProject(prev => ({ ...prev, [name]: value }));
    } else if (showEditModal) {
      setEditingProject(prev => ({ ...prev, [name]: value }));
    }
  }, [showAddModal, showEditModal]); // Dependencies: showAddModal, showEditModal

  // Handles image file selection. Wrapped in useCallback.
  const handleImageChange = useCallback((e) => {
    setProjectImage(e.target.files[0]);
  }, []); // No dependencies

  // Closes all modals and resets relevant states. Wrapped in useCallback.
  const handleCloseModals = useCallback(() => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingProject(null); // Reset editing project
    setNewProject({ title: '', description: '', status: 'Planning', clientId: '' }); // Reset new project form
    setProjectImage(null); // Clear selected image
    setError(''); // Clear any errors
  }, []); // No dependencies

  // Handles adding a new project. Wrapped in useCallback.
  const handleAddProject = useCallback(async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    const formData = new FormData();
    formData.append('title', newProject.title);
    formData.append('description', newProject.description);
    formData.append('status', newProject.status);
    formData.append('clientId', newProject.clientId);
    if (projectImage) {
      formData.append('projectImage', projectImage);
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'x-auth-token': token }, // Note: FormData headers automatically set Content-Type
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to add project');
      }
      handleCloseModals();
      fetchData();
    } catch (err) {
      console.error("Error adding project:", err);
      setError(err.message || 'Error adding project.');
    }
  }, [newProject, projectImage, token, handleCloseModals, fetchData]); // Dependencies

  // Handles updating an existing project. Wrapped in useCallback.
  const handleUpdateProject = useCallback(async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    if (!editingProject) return;

    const formData = new FormData();
    formData.append('title', editingProject.title);
    formData.append('description', editingProject.description);
    formData.append('status', editingProject.status);
    // Ensure clientId is correctly sent as an ID string (not an object)
    formData.append('clientId', editingProject.clientId?._id || editingProject.clientId); 
    if (projectImage) {
      formData.append('projectImage', projectImage);
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${editingProject._id}`, {
        method: 'PUT',
        headers: { 'x-auth-token': token },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to update project');
      }
      handleCloseModals();
      fetchData();
    } catch (err) {
      console.error("Error updating project:", err);
      setError(err.message || 'Error updating project.');
    }
  }, [editingProject, projectImage, token, handleCloseModals, fetchData]); // Dependencies

  // Handles deleting a project. Wrapped in useCallback.
  const handleDeleteProject = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    setError(''); // Clear previous errors
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to delete project');
      }
      fetchData();
    } catch (err) {
      console.error("Error deleting project:", err);
      setError(err.message || 'Error deleting project.');
    }
  }, [token, fetchData]); // Dependencies

  // Display loading message
  if (isLoading) return <div className="loading-message">Loading projects...</div>;
  // Display general errors
  if (error) return <div className="error-message">Error: {error}</div>;


  return (
    <div className="projects-page">
      <div className="page-header">
        <h1 className="page-title">Manage Projects</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add Project</button>
      </div>

      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Client</th>
              <th>Status</th>
              <th>Comments</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length > 0 ? (
              projects.map(project => (
                <tr key={project._id}>
                  <td>
                    {/* The link to ProjectDetail page */}
                    <Link to={`/projects/${project._id}`} className="project-title-link">{project.title}</Link>
                  </td>
                  <td>{project.client ? project.client.name : 'N/A'}</td> {/* Display client company name */}
                  <td>{project.status}</td>
                  <td>{project.commentCount || 0}</td>
                  <td className="actions-cell">
                    <button className="edit-button" onClick={() => { setEditingProject(project); setShowEditModal(true); }}>Edit</button>
                    <button className="delete-button" onClick={() => handleDeleteProject(project._id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No projects found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header"><h2 className="modal-title">Add New Project</h2><button className="close-button" onClick={handleCloseModals}>&times;</button></div>
            {error && <div className="error-message">{error}</div>} {/* Display error */}
            <form onSubmit={handleAddProject}>
              <div className="form-group"><label>Title</label><input type="text" name="title" value={newProject.title} onChange={handleInputChange} required /></div>
              <div className="form-group">
                <label>Client</label>
                <select name="clientId" value={newProject.clientId} onChange={handleInputChange} required>
                  <option value="">Select a Client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group"><label>Description</label><textarea name="description" rows="3" value={newProject.description} onChange={handleInputChange}></textarea></div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={newProject.status} onChange={handleInputChange}>
                  <option>Planning</option><option>In Progress</option><option>Pending Review</option><option>Completed</option>
                </select>
              </div>
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
            <div className="modal-header"><h2 className="modal-title">Edit Project</h2><button className="close-button" onClick={handleCloseModals}>&times;</button></div>
            {error && <div className="error-message">{error}</div>} {/* Display error */}
            <form onSubmit={handleUpdateProject}>
              <div className="form-group"><label>Title</label><input type="text" name="title" value={editingProject.title} onChange={handleInputChange} required /></div>
              <div className="form-group">
                <label>Client</label>
                {/* Ensure clientId is correctly handled for select value */}
                <select name="clientId" value={editingProject.clientId?._id || ''} onChange={handleInputChange} required>
                  <option value="">Select a Client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>{client.name}</option>
                  ))}
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
    </div>
  );
}

export default Projects;