// client-portal/src/components/MilestoneCard.js
import React, { useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import './MilestoneCard.css';

function MilestoneCard({ milestone, projectId }) {
  const [suggestion, setSuggestion] = useState(milestone.clientSuggestions || '');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const { authFetch } = useAuth();

  const handleSuggestionSubmit = useCallback(async (e) => {
    e.preventDefault();
    setMessage('');
    if (!suggestion.trim()) {
      setMessage('Suggestion cannot be empty.');
      setMessageType('error');
      return;
    }

    try {
      const response = await authFetch(`/api/client/milestones/${milestone._id}/suggest`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to submit suggestion.');
      setMessage('Suggestion submitted successfully!');
      setMessageType('success');
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  }, [suggestion, authFetch, milestone._id]);

  const getStatusClass = (status) => status.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className={`milestone-card status-${getStatusClass(milestone.status)}`}>
      <div className="milestone-header">
        <h4>{milestone.name}</h4>
        <span className="milestone-due-date">
          Due: {new Date(milestone.dueDate).toLocaleDateString()}
        </span>
      </div>
      <p className="milestone-description">{milestone.description}</p>
      
      <div className="suggestion-area">
        <form onSubmit={handleSuggestionSubmit}>
          <textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Provide your feedback or suggestions here..."
            rows="4"
          />
          <button type="submit" className="submit-suggestion-btn">Submit Feedback</button>
        </form>
        {message && <p className={`message-display ${messageType}`}>{message}</p>}
      </div>
    </div>
  );
}

export default MilestoneCard;