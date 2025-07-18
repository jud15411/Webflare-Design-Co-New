import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Shared.css';
import './ProjectDetail.css';

// Helper function for fetching data to reduce repetition
async function fetchData(url, token) {
  const response = await fetch(url, {
    headers: { 'x-auth-token': token }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ msg: 'An unknown error occurred.' }));
    throw new Error(`Failed to fetch from ${url}: ${errorData.msg}`);
  }
  return response.json();
}


function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiMessage, setApiMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [milestones, setMilestones] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [totalHours, setTotalHours] = useState(0);

  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', description: '', dueDate: '' });

  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL;

  const loadProjectData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const projectData = await fetchData(`${API_URL}/api/projects/${projectId}`, token);
      setProject(projectData);

      const milestonesData = await fetchData(`${API_URL}/api/projects/${projectId}/milestones`, token);
      setMilestones(milestonesData);

      const filesData = await fetchData(`${API_URL}/api/projects/${projectId}/files`, token);
      setFiles(filesData);

      const commentsData = await fetchData(`${API_URL}/api/projects/${projectId}/comments`, token);
      setComments(commentsData);
      
      const hoursData = await fetchData(`${API_URL}/api/projects/${projectId}/hours`, token);
      setTotalHours(hoursData.totalHours || 0);

    } catch (err) {
      console.error("Detailed Fetch Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, token, API_URL]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  const displayApiMessage = (message, type) => {
    setApiMessage(message);
    setMessageType(type);
    setTimeout(() => {
      setApiMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      displayApiMessage('Please select a file to upload.', 'error');
      return;
    }
    const formData = new FormData();
    formData.append('projectFile', selectedFile);
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'File upload failed.');
      displayApiMessage('File uploaded successfully!', 'success');
      setFiles(prevFiles => [data, ...prevFiles]);
      setSelectedFile(null);
      e.target.reset();
    } catch (err) {
      displayApiMessage(err.message, 'error');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      displayApiMessage('Comment cannot be empty.', 'error');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ text: newComment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to post comment.');
      setComments(prevComments => [data, ...prevComments]);
      setNewComment('');
    } catch (err) {
      displayApiMessage(err.message, 'error');
    }
  };

  const handleMilestoneInputChange = (e) => {
    const { name, value } = e.target;
    setNewMilestone(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`${API_URL}/api/projects/${projectId}/milestones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify(newMilestone),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Failed to add milestone.');
        setMilestones(prev => [...prev, data].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
        setShowAddMilestoneModal(false);
        setNewMilestone({ name: '', description: '', dueDate: '' });
        displayApiMessage('Milestone added successfully!', 'success');
    } catch (err) {
        displayApiMessage(err.message, 'error');
    }
  };

  // New handler for updating milestone status
  const handleStatusChange = async (milestoneId, newStatus) => {
    try {
        const response = await fetch(`${API_URL}/api/milestones/${milestoneId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
            },
            body: JSON.stringify({ status: newStatus }),
        });
        const updatedMilestone = await response.json();
        if (!response.ok) throw new Error(updatedMilestone.msg || 'Failed to update status.');

        // Update the milestone in the local state
        setMilestones(prev => prev.map(m => m._id === milestoneId ? updatedMilestone : m));
        displayApiMessage('Status updated!', 'success');
    } catch (err) {
        displayApiMessage(err.message, 'error');
    }
  };

  if (isLoading) return <div>Loading project details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!project) return <div>Project not found.</div>;

  return (
    <div className="project-detail-page">
      <Link to="/projects" className="back-button">← Back to Projects</Link>

      <div className="page-header">
        <h1 className="page-title">{project.title}</h1>
      </div>

      <div className="project-meta-data">
        <h3>Project Details</h3>
        <p><strong>Client:</strong> {project.clientId ? project.clientId.name : 'N/A'}</p>
        <p><strong>Status:</strong> {project.status}</p>
        <p><strong>Total Hours Logged:</strong> {totalHours.toFixed(2)}</p>
      </div>

      <div className="milestone-section">
        <h3>
          Project Milestones
          <button className="add-button" onClick={() => setShowAddMilestoneModal(true)}>+ Add Milestone</button>
        </h3>
        <div className="milestone-list">
          {milestones.length > 0 ? milestones.map(milestone => (
            <div key={milestone._id} className="milestone-item">
              <div className="milestone-header">
                <span className="milestone-name">{milestone.name}</span>
                
                {/* FIX: Replaced status text with a dropdown */}
                <select
                  className="milestone-status-select"
                  value={milestone.status}
                  onChange={(e) => handleStatusChange(milestone._id, e.target.value)}
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>On Hold</option>
                  <option>Completed</option>
                  <option>Canceled</option>
                </select>

              </div>
              {milestone.description && <p className="milestone-description">{milestone.description}</p>}
              {milestone.clientSuggestions && (
                <div className="client-suggestion-box">
                  <p className="suggestion-title">
                    Client Suggestion
                    {milestone.lastSuggestedBy && ` by ${milestone.lastSuggestedBy.name}`}
                    {milestone.lastSuggestionDate && ` on ${new Date(milestone.lastSuggestionDate).toLocaleDateString()}`}
                  </p>
                  <p className="suggestion-text">{milestone.clientSuggestions}</p>
                </div>
              )}
              <p className="milestone-due-date">
                Due: {new Date(milestone.dueDate).toLocaleDateString()}
              </p>
            </div>
          )) : <p>No milestones have been set for this project yet.</p>}
        </div>
      </div>

      <div className="file-section">
        <h3>Project Files</h3>
        <form onSubmit={handleFileUpload} className="file-upload-form">
          <div className="form-group">
            <label htmlFor="file-upload">Upload New File</label>
            <input id="file-upload" type="file" onChange={handleFileChange} />
          </div>
          <button type="submit" className="upload-button">Upload</button>
        </form>
        <div className="file-list">
          <ul>
            {files.length > 0 ? files.map(file => (
              <li key={file._id} className="file-item">
                <a href={`${API_URL}${file.path}`} target="_blank" rel="noopener noreferrer">{file.originalName}</a>
                <div className="file-meta">
                  <span>{(file.size / 1024).toFixed(2)} KB</span>
                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                </div>
              </li>
            )) : <p>No files uploaded yet.</p>}
          </ul>
        </div>
      </div>

      <div className="comment-section">
        <h3>Developer Comments</h3>
        <form onSubmit={handleCommentSubmit} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a new comment..."
            rows="4"
          />
          <button type="submit">Post Comment</button>
        </form>
        <div className="comment-list">
          {comments.length > 0 ? comments.map(comment => (
            <div key={comment._id} className="comment-item">
              <p className="comment-text">{comment.text}</p>
              <p className="comment-meta">
                by <strong>{comment.author ? comment.author.name : 'Unknown User'}</strong> on {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
          )) : <p>No comments yet.</p>}
        </div>
      </div>
      
      {apiMessage && <div className={`message-banner ${messageType}`}>{apiMessage}</div>}

      {showAddMilestoneModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Milestone</h2>
              <button className="close-button" onClick={() => setShowAddMilestoneModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddMilestone}>
              <div className="form-group">
                <label>Milestone Name</label>
                <input type="text" name="name" value={newMilestone.name} onChange={handleMilestoneInputChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" rows="3" value={newMilestone.description} onChange={handleMilestoneInputChange}></textarea>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" name="dueDate" value={newMilestone.dueDate} onChange={handleMilestoneInputChange} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowAddMilestoneModal(false)}>Cancel</button>
                <button type="submit" className="submit-button">Add Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;