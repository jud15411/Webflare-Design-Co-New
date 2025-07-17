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
    // Try to parse the error message from the server, or use a default
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

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [totalHours, setTotalHours] = useState(0);

  const token = localStorage.getItem('token');

  const loadProjectData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch data sequentially for better error reporting
      const projectData = await fetchData(`/api/projects/${projectId}`, token);
      setProject(projectData);

      const filesData = await fetchData(`/api/projects/${projectId}/files`, token);
      setFiles(filesData);

      const commentsData = await fetchData(`/api/projects/${projectId}/comments`, token);
      setComments(commentsData);
      
      const hoursData = await fetchData(`/api/projects/${projectId}/hours`, token);
      setTotalHours(hoursData.totalHours || 0);

    } catch (err) {
      console.error("Detailed Fetch Error:", err);
      setError(err.message); // This will now show which API call failed
    } finally {
      setIsLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // ... (the rest of your component functions: handleFileChange, handleFileUpload, handleCommentSubmit)
  // No changes are needed for the rest of the file.
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
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'File upload failed.');
      
      displayApiMessage('File uploaded successfully!', 'success');
      setFiles(prevFiles => [data, ...prevFiles]);
      setSelectedFile(null);
      e.target.reset(); // Reset the form
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
      const response = await fetch(`/api/projects/${projectId}/comments`, {
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


  if (isLoading) return <div>Loading project details...</div>;
  if (error) return <div className="error-message">{error}</div>; // This will now be a specific error
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
                <a href={`${process.env.REACT_APP_API_URL}${file.path}`} target="_blank" rel="noopener noreferrer">{file.originalName}</a>
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
                by <strong>{comment.author.name}</strong> on {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
          )) : <p>No comments yet.</p>}
        </div>
      </div>
      
      {apiMessage && <div className={`message-banner ${messageType}`}>{apiMessage}</div>}
    </div>
  );
}

export default ProjectDetail;