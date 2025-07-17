// client-portal/src/components/MilestoneCard.js
import React, { useState, useEffect } from 'react';
import './MilestoneCard.css'; // We'll create this CSS file next

function MilestoneCard({ milestone, onSuggestionSubmit, suggestionText, setSuggestionText }) {
  const [localSuggestion, setLocalSuggestion] = useState(milestone.clientSuggestions || '');
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);

  useEffect(() => {
    setLocalSuggestion(milestone.clientSuggestions || '');
  }, [milestone.clientSuggestions]);

  const handleLocalSuggestionChange = (e) => {
    setLocalSuggestion(e.target.value);
    // You might want to update the parent's state (suggestionText) only when the form is submitted,
    // or keep it local until then. For this example, we keep it local until submit.
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuggestionSubmit(milestone._id, localSuggestion);
    setShowSuggestionForm(false); // Hide form after submission
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'In Progress': return 'status-in-progress';
      case 'Not Started': return 'status-not-started';
      case 'On Hold': return 'status-on-hold';
      case 'Canceled': return 'status-canceled';
      default: return '';
    }
  };

  return (
    <div className={`milestone-card ${getStatusClass(milestone.status)}`}>
      <h4>{milestone.name}</h4>
      <p className="milestone-description">{milestone.description}</p>
      <p>Due Date: {new Date(milestone.dueDate).toLocaleDateString()}</p>
      <p>Status: <span className={`milestone-status-badge ${getStatusClass(milestone.status)}`}>{milestone.status}</span></p>
      
      {milestone.completionDate && (
        <p>Completion Date: {new Date(milestone.completionDate).toLocaleDateString()}</p>
      )}

      {/* Display Tasks associated with this milestone */}
      {milestone.tasks && milestone.tasks.length > 0 && (
        <div className="milestone-tasks">
          <h5>Tasks:</h5>
          <ul>
            {milestone.tasks.map(task => (
              <li key={task._id}>
                {task.title} (Status: {task.status}) {task.assignedTo?.name ? `- ${task.assignedTo.name}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="client-suggestion-section">
        <h5>Your Suggestions:</h5>
        {milestone.clientSuggestions ? (
          <p className="current-suggestion">"{milestone.clientSuggestions}" 
             {milestone.lastSuggestionDate && ` (Last updated: ${new Date(milestone.lastSuggestionDate).toLocaleDateString()})`}
          </p>
        ) : (
          <p className="no-suggestion">No suggestions submitted for this milestone yet.</p>
        )}

        <button 
          onClick={() => setShowSuggestionForm(!showSuggestionForm)} 
          className="toggle-suggestion-form-button"
        >
          {showSuggestionForm ? 'Hide Suggestion Form' : 'Add/Edit Suggestion'}
        </button>

        {showSuggestionForm && (
          <form onSubmit={handleSubmit} className="suggestion-form">
            <textarea
              value={localSuggestion}
              onChange={handleLocalSuggestionChange}
              placeholder="Enter your suggestions or advice here..."
              rows="4"
              required
            ></textarea>
            <button type="submit" className="submit-suggestion-button">Submit Suggestion</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default MilestoneCard;