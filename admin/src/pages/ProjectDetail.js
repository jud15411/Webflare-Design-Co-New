import React, { useState, useEffect, useCallback } from 'react';
import './ProjectDetail.css'; // New CSS file for this component

function ProjectDetail({ project, onBack, token }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${project._id}/comments`, { 
      headers: { 'x-auth-token': token }
    });
    const commentsData = await response.json();
    setComments(commentsData);
    setIsLoading(false);
  }, [project._id, token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${project._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ text: newComment })
    });
    const savedComment = await response.json();
    setComments([savedComment, ...comments]);
    setNewComment('');
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