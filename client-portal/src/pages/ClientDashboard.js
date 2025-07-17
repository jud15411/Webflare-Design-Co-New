// client-portal/src/pages/ClientDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import './ClientDashboard.css'; // We'll create this CSS file next

function ClientDashboard() {
  const { user, authFetch } = useAuth(); // Use authFetch for authenticated requests
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClientProjects = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Use authFetch for this request
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/client/projects`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to fetch client projects.');
      }
      setProjects(data);
    } catch (err) {
      console.error("Error fetching client projects:", err);
      setError(err.message || 'Error loading your projects.');
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]); // Dependency on authFetch

  useEffect(() => {
    if (user && user.role === 'Client') {
      fetchClientProjects();
    }
  }, [user, fetchClientProjects]); // Dependency on user and fetchClientProjects

  if (isLoading) {
    return <div className="loading-message">Loading your projects...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="client-dashboard">
      <div className="page-header">
        <h1 className="page-title">My Projects</h1>
      </div>
      <div className="project-list">
        {projects.length > 0 ? (
          projects.map(project => (
            <div key={project._id} className="project-card">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <p>Status: <span className={`project-status ${project.status.toLowerCase().replace(/\s/g, '-')}`}>{project.status}</span></p>
              <p>Client Company: {project.clientId ? project.clientId.name : 'N/A'}</p>
              <Link to={`/projects/${project._id}`} className="view-details-button">View Details</Link>
            </div>
          ))
        ) : (
          <p className="empty-message">No projects found for your account.</p>
        )}
      </div>
    </div>
  );
}

export default ClientDashboard;