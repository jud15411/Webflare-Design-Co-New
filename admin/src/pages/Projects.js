import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css';
import './Projects.css'; // Make sure you have created this CSS file

function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(''); // Correctly declare both 'error' and 'setError'
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
        fetch(`${process.env.REACT_APP_API_URL}/api/projects`, { headers: { 'x-auth-token': token } }),
        fetch(`${process.env.REACT_APP_API_URL}/api/clients`, { headers: { 'x-auth-token': token } })
      ]);

      if (!projectsRes.ok || !clientsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const projectsData = await projectsRes.json();
      const clientsData = await clientsRes.json();
      
      setProjects(projectsData);
      setClients(clientsData);
      setError(''); // Use setError to clear previous errors
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

    await fetch(`${process.env.REACT_APP_API_URL}/api/projects`, {
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

    await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${editingProject._id}`, {
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
      await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      fetchData();
    }
  };
  
  const handleToggleFeature = async (projectId) => {
    setError(''); // Use setError
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${projectId}/toggle-feature`, {
        method: 'PUT',
        headers: { 'x-auth-token': token }
    });
    if (!response.ok) {
        const errData = await response.json();
        setError(errData.msg); // Use setError
    } else {
        fetchData();
    }
  };

  const handleProjectClick = (project) => {
    // This is where you would navigate to a detail view in a larger app
    // For now, we can just open the edit modal as a shortcut
    openEditModal(project);
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
                    <td>
                      {/* Using a button for accessibility, styled like a link */}
                      <button onClick={() => handleProjectClick(project)} className="project-link-button">
                        {project.title}
                      </button>
                    </td>
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
          {/* ... Add Modal JSX ... */}
        </div>
      )}

      {showEditModal && editingProject && (
        <div className="modal-backdrop">
          {/* ... Edit Modal JSX ... */}
        </div>
      )}
    </div>
  );
}

export default Projects;