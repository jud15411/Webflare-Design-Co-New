// client-portal/src/pages/ClientProjectDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import MilestoneCard from '../components/MilestoneCard';
import './ClientProjectDetail.css';

function ClientProjectDetail() {
  const { projectId } = useParams();
  const { authFetch } = useAuth();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProjectDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/client/projects/${projectId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to fetch project details.');
      const sortedMilestones = data.milestones.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      setProject({ ...data, milestones: sortedMilestones });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, authFetch]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  if (isLoading) return <div className="loading-container"><div className="loader"></div></div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!project) return <div className="empty-message">Project details could not be loaded.</div>;

  return (
    <div className="client-project-detail">
      <header className="project-header">
        <h1>{project.title}</h1>
        <div className="header-meta">
          <span className={`status-pill ${project.status.toLowerCase().replace(/\s/g, '-')}`}>{project.status}</span>
          <span>Client: {project.clientId?.name || 'N/A'}</span>
        </div>
      </header>

      <section className="project-description-section">
        <h2>Project Overview</h2>
        <p>{project.description}</p>
      </section>

      <section className="milestones-section">
        <h2>Project Milestones</h2>
        <div className="milestones-grid">
          {project.milestones.length > 0 ? (
            project.milestones.map(milestone => (
              <MilestoneCard key={milestone._id} milestone={milestone} projectId={project._id} />
            ))
          ) : (
            <p className="no-milestones">No milestones have been defined for this project yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default ClientProjectDetail;