// client-portal/src/pages/ClientProjectDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import MilestoneCard from '../components/MilestoneCard'; // Import the MilestoneCard component
import './ClientProjectDetail.css'; // We'll create this CSS file next

function ClientProjectDetail() {
  const { projectId } = useParams();
  const { authFetch } = useAuth();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [suggestionText, setSuggestionText] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const fetchProjectDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch project details for the specific client's project
      // Note: The /api/client/projects endpoint returns an array of projects.
      // You might ideally have a /api/client/projects/:id endpoint.
      // For simplicity, we'll fetch all and filter, or adjust if backend has :id route for client
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/client/projects`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to fetch project details.');
      }

      const foundProject = data.find(p => p._id === projectId);
      if (foundProject) {
        // Ensure milestones are sorted by due date
        const sortedMilestones = foundProject.milestones.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        setProject({ ...foundProject, milestones: sortedMilestones });
      } else {
        setError('Project not found or you do not have access.');
      }
    } catch (err) {
      console.error("Error fetching project details:", err);
      setError(err.message || 'Error loading project details.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, authFetch]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleSuggestionSubmit = async (milestoneId) => {
    setMessage('');
    setMessageType('');
    if (!suggestionText.trim()) {
      setMessage('Suggestion cannot be empty.');
      setMessageType('error');
      return;
    }

    try {
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/api/client/milestones/${milestoneId}/suggest`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestion: suggestionText }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to submit suggestion.');
      }

      setMessage('Suggestion submitted successfully!');
      setMessageType('success');
      setSuggestionText(''); // Clear the textarea
      fetchProjectDetails(); // Re-fetch to update milestone with new suggestion
    } catch (err) {
      console.error("Error submitting suggestion:", err);
      setMessage(err.message || 'Error submitting suggestion.');
      setMessageType('error');
    }
  };

  if (isLoading) {
    return <div className="loading-message">Loading project details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!project) {
    return <div className="empty-message">Project details could not be loaded.</div>;
  }

  return (
    <div className="client-project-detail">
      <div className="page-header">
        <h1 className="page-title">{project.title}</h1>
        <p className="project-detail-status">Status: <span className={`project-status ${project.status.toLowerCase().replace(/\s/g, '-')}`}>{project.status}</span></p>
        <p className="project-detail-client">Client: {project.clientId ? project.clientId.name : 'N/A'}</p>
        <p className="project-description">{project.description}</p>
      </div>

      {message && (
        <div className={`message-banner ${messageType}`}>
          {message}
          <button className="close-message" onClick={() => setMessage('')}>X</button>
        </div>
      )}

      <div className="milestones-section">
        <h2>Project Milestones</h2>
        {project.milestones && project.milestones.length > 0 ? (
          project.milestones.map(milestone => (
            <MilestoneCard
              key={milestone._id}
              milestone={milestone}
              onSuggestionSubmit={handleSuggestionSubmit} // Pass handler for suggestions
              suggestionText={suggestionText}
              setSuggestionText={setSuggestionText}
            />
          ))
        ) : (
          <p className="empty-message">No milestones defined for this project yet.</p>
        )}
      </div>

      {/* You can add a general project comment section here if distinct from milestone suggestions */}
    </div>
  );
}

export default ClientProjectDetail;