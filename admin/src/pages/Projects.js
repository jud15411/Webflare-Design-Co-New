import React, { useState, useEffect, useCallback } from 'react';
import ProjectDetail from './ProjectDetail'; // Import the new component
import './Shared.css';
import './Projects.css';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for which view to show
  const [selectedProject, setSelectedProject] = useState(null);

  // State for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
  // State for forms
  const [newProject, setNewProject] = useState({ title: '', description: '', status: 'Planning', clientId: '' });
  const [projectImage, setProjectImage] = useState(null);

  const token = localStorage.getItem('token');

  const fetchData = useCallback(async () => { /* ... (no changes needed) */ }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- All handler functions (handleInputChange, handleAddProject, etc.) remain the same ---

  // If a project is selected, show the detail view
  if (selectedProject) {
    return (
      <ProjectDetail 
        project={selectedProject} 
        token={token}
        onBack={() => setSelectedProject(null)} 
      />
    );
  }

  // Otherwise, show the list of all projects
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add Project</button>
      </div>
      
      {/* ... Info/Error bar ... */}

      <div className="data-table-container">
        <table>
          <thead>
            <tr><th>Title</th><th>Client</th><th>Status</th><th>Featured</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project._id}>
                <td>
                  {/* This now switches to the detail/comment view */}
                  <button onClick={() => setSelectedProject(project)} className="project-link-button">
                    {project.title}
                  </button>
                </td>
                <td>{project.clientId?.name || 'N/A'}</td>
                <td>{project.status}</td>
                <td>{project.isFeatured ? 'Yes' : 'No'}</td>
                <td className="actions-cell">
                  {/* This now only opens the edit modal */}
                  <button className="edit-button" onClick={() => openEditModal(project)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDeleteProject(project._id)}>Delete</button>
                  <button onClick={() => handleToggleFeature(project._id)}>{project.isFeatured ? 'Un-feature' : 'Feature'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Modals --- */}
      {/* The Add and Edit modals will now correctly appear as overlays on top of the project list */}
      {showAddModal && (
        <div className="modal-backdrop">{/* ... Add Modal JSX ... */}</div>
      )}
      {showEditModal && editingProject && (
        <div className="modal-backdrop">{/* ... Edit Modal JSX ... */}</div>
      )}
    </div>
  );
}

export default Projects;