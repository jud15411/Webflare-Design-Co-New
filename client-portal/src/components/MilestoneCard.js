// In client-portal/src/components/MilestoneCard.js

import React, { useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import './MilestoneCard.css';

function MilestoneCard({ milestone, projectId }) {
  const [suggestion, setSuggestion] = useState(milestone.clientSuggestions || '');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const { token } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  const handleSuggestionSubmit = useCallback(async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    if (!suggestion.trim()) {
      setMessage('Suggestion cannot be empty.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/client/milestones/${milestone._id}/suggest`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ suggestion }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to submit suggestion.');
      }

      setMessage('Suggestion submitted successfully!');
      setMessageType('success');
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  }, [suggestion, API_URL, milestone._id, token]);
  
  const getStatusClass = (status) => {
    return status.replace(/\s+/g, '-').toLowerCase();
  };

  return (
    <div className="milestone-card">
      <div className="milestone-card-header">
        <h4>{milestone.name}</h4>
        <span className={`status-badge ${getStatusClass(milestone.status)}`}>
          {milestone.status}
        </span>
      </div>
      <p className="milestone-card-description">{milestone.description}</p>
      <div className="milestone-card-footer">
        <span className="due-date">
          Due: {new Date(milestone.dueDate).toLocaleDateString()}
        </span>
      </div>
      <div className="suggestion-section">
        <form onSubmit={handleSuggestionSubmit}>
          <textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Add your suggestions or feedback here..."
            rows="3"
          />
          <button type="submit">Submit Suggestion</button>
        </form>
        {message && <p className={`message-display ${messageType}`}>{message}</p>}
      </div>
    </div>
  );
}

export default MilestoneCard;