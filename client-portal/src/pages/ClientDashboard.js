// client-portal/src/pages/ClientDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
import './ClientDashboard.css';

function ClientDashboard() {
  const { user, authFetch } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClientProjects = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
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
  }, [authFetch]);

  useEffect(() => {
    if (user && user.role === 'Client') {
      fetchClientProjects();
    }
  }, [user, fetchClientProjects]);

  if (isLoading) {
    return <div className="loading-container"><div className="loader"></div></div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="client-dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name || 'Client'}</h1>
        <p>Here’s a summary of your active and past projects.</p>
      </header>
      <main className="project-grid">
        {projects.length > 0 ? (
          projects.map(project => (
            <div key={project._id} className="project-card-container">
              <Link to={`/projects/${project._id}`} className="project-card-link">
                <div className="project-card">
                  <div className="project-card-header">
                    <h3>{project.title}</h3>
                    <span className={`project-status-badge ${project.status.toLowerCase().replace(/\s/g, '-')}`}>{project.status}</span>
                  </div>
                  <p className="project-description">{project.description}</p>
                  <div className="project-card-footer">
                    <span>View Project Details</span>
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h2>No Projects Found</h2>
            <p>It looks like you don't have any projects with us yet. Contact us to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ClientDashboard;