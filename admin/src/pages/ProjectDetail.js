import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Shared.css';
import './ProjectDetail.css';

const API_URL = process.env.REACT_APP_API_URL;

// Helper to safely fetch data and handle errors
async function fetchData(url, token) {
  const response = await fetch(url, { headers: { 'x-auth-token': token } });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ msg: `An unknown error occurred fetching from ${url}` }));
    throw new Error(errorData.msg);
  }
  return response.json();
}

function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [comments, setComments] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newComment, setNewComment] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const token = localStorage.getItem('token');

  const fetchAllProjectData = useCallback(async () => {
    // No need to set loading here, as the initial load is handled by the useEffect
    try {
      const [projectData, milestonesData, commentsData, filesData] = await Promise.all([
        fetchData(`${API_URL}/api/projects/${projectId}`, token),
        fetchData(`${API_URL}/api/projects/${projectId}/milestones`, token),
        fetchData(`${API_URL}/api/projects/${projectId}/comments`, token),
        fetchData(`${API_URL}/api/projects/${projectId}/files`, token)
      ]);
      
      setProject(projectData);
      setMilestones(milestonesData);
      setComments(commentsData);
      setFiles(filesData);

    } catch (err) {
      console.error("Failed to fetch project details:", err);
      setError(err.message);
    }
  }, [projectId, token]);

  useEffect(() => {
    setIsLoading(true);
    fetchAllProjectData().finally(() => setIsLoading(false));
  }, [fetchAllProjectData]);

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ text: newComment }),
      });
      if (!response.ok) throw new Error('Failed to post comment.');
      const postedComment = await response.json();
      setComments([postedComment, ...comments]);
      setNewComment('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('projectFile', selectedFile);

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload file.');
      const uploadedFile = await response.json();
      setFiles([uploadedFile, ...files]);
      setSelectedFile(null);
      document.getElementById('file-input').value = null; // Clear file input
    } catch (err) {
      setError(err.message);
    }
  };


  if (isLoading) {
    return <div className="loading-container">Loading Project Details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Failed to Load Project</h2>
        <p>{error}</p>
        <Link to="/projects" className="back-button">Go Back to Projects</Link>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      <Link to="/projects" className="back-button">← Back to Projects</Link>
      
      <div className="page-header">
        <h1 className="page-title">{project?.title || 'Project Title'}</h1>
      </div>

      <div className="project-meta-data">
          <h3>Project Details</h3>
          <p><strong>Status:</strong> <span className={`status status-${project?.status.toLowerCase()}`}>{project?.status}</span></p>
          <p><strong>Client:</strong> {project?.clientId?.name || 'N/A'}</p>
          <p><strong>Description:</strong> {project?.description || 'No description provided.'}</p>
      </div>
      
      {/* File Upload Section */}
      <div className="file-section form-section">
          <h3>Upload File</h3>
          <input type="file" id="file-input" onChange={handleFileChange} />
          <button onClick={handleFileUpload} disabled={!selectedFile}>Upload</button>
      </div>
      
      {/* Files List */}
      <div className="file-section">
        <h3>Project Files</h3>
        <ul className="file-list">
            {files.length > 0 ? files.map(file => (
                <li key={file._id}>
                    <a href={`${API_URL}${file.path}`} target="_blank" rel="noopener noreferrer">{file.originalName}</a>
                    <span>({(file.size / 1024).toFixed(2)} KB)</span>
                </li>
            )) : <p>No files uploaded yet.</p>}
        </ul>
      </div>

      {/* Comment Submission Form */}
      <div className="comment-section form-section">
        <h3>Add a Comment</h3>
        <form onSubmit={handleCommentSubmit}>
            <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
            ></textarea>
            <button type="submit">Post Comment</button>
        </form>
      </div>

      {/* Comments List */}
      <div className="comment-section">
        <h3>Comments</h3>
        <div className="comment-list">
            {comments.length > 0 ? comments.map(comment => (
                <div key={comment._id} className="comment-item">
                    <p className="comment-author">{comment.author?.name || 'User'}</p>
                    <p className="comment-text">{comment.text}</p>
                    <p className="comment-date">{new Date(comment.createdAt).toLocaleString()}</p>
                </div>
            )) : <p>No comments yet.</p>}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;