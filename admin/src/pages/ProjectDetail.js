import React, { useState, useEffect, useCallback } from 'react';
import './ProjectDetail.css';

function ProjectDetail({ project, onBack, token }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUploadError, setFileUploadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [commentsRes, filesRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/projects/${project._id}/comments`, {
          headers: { 'x-auth-token': token }
        }),
        fetch(`${process.env.REACT_APP_API_URL}/api/projects/${project._id}/files`, {
          headers: { 'x-auth-token': token }
        })
      ]);

      if (!commentsRes.ok || !filesRes.ok) {
        throw new Error('Failed to fetch project details');
      }

      const commentsData = await commentsRes.json();
      const filesData = await filesRes.json();

      setComments(commentsData);
      setFiles(filesData);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [project._id, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setFileUploadError('');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileUploadError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('projectFile', selectedFile);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${project._id}/files`, {
        method: 'POST',
        headers: { 'x-auth-token': token },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.msg || 'File upload failed');
      }

      setSelectedFile(null);
      setFileUploadError('');
      e.target.reset();
      fetchData();
    } catch (error) {
      setFileUploadError(error.message);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${project._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ text: newComment })
    });

    if (response.ok) {
      setNewComment('');
      fetchData();
    } else {
      console.error("Failed to post comment.");
    }
  };

  return (
    <div>
      <button className="back-button" onClick={onBack}>&larr; Back to All Projects</button>
      <h1 className="page-title">{project.title}</h1>
      <div className="project-meta-data">
        <p><strong>Client:</strong> {project.clientId?.name}</p>
        <p><strong>Status:</strong> {project.status}</p>
        <p><strong>Description:</strong> {project.description}</p>
      </div>

      <div className="file-section">
        <h3>Project Files & Media</h3>
        <form onSubmit={handleFileUpload} className="file-upload-form">
          <div className="form-group">
            <label htmlFor="file-input">Upload New File</label>
            <input id="file-input" type="file" onChange={handleFileChange} />
          </div>
          <button type="submit" className="upload-button">Upload</button>
          {fileUploadError && <p className="error-message">{fileUploadError}</p>}
        </form>
        <div className="file-list">
          {isLoading ? <p>Loading files...</p> : files.length > 0 ? (
            <ul>
              {files.map(file => (
                <li key={file._id} className="file-item">
                  <a href={`${process.env.REACT_APP_API_URL}${file.path}`} target="_blank" rel="noopener noreferrer">
                    {file.originalName}
                  </a>
                  <div className="file-meta">
                     Uploaded on {new Date(file.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No files have been uploaded for this project.</p>
          )}
        </div>
      </div>

      <div className="comment-section">
        <h3>Developer Comments</h3>
        <form onSubmit={handlePostComment} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write an update or ask a question..."
            rows="3"
          />
          <button type="submit">Post Comment</button>
        </form>
        <div className="comment-list">
          {isLoading ? <p>Loading comments...</p> : comments.map(comment => (
            <div key={comment._id} className="comment-card">
              <p className="comment-text">{comment.text}</p>
              <div className="comment-meta">
                <span>by <strong>{comment.author?.name}</strong></span>
                <span>on {new Date(comment.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;