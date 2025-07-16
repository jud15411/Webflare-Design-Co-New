import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css'; // Your shared styles
import './Projects.css'; // We will create this new CSS file

function Projects() {
  // Existing states
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New states for detail view and comments
  const [selectedProject, setSelectedProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const token = localStorage.getItem('token');

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects`, { headers: { 'x-auth-token': token } });
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError('Failed to load projects.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectClick = async (project) => {
    setSelectedProject(project);
    // Fetch comments for the selected project
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${project._id}/comments`, { headers: { 'x-auth-token': token }});
    const commentsData = await response.json();
    setComments(commentsData);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return; // Don't post empty comments

    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${selectedProject._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ text: newComment })
    });
    const savedComment = await response.json();
    setComments([savedComment, ...comments]); // Add new comment to the top of the list
    setNewComment(''); // Clear the input
  };

  if (isLoading) return <div>Loading projects...</div>;

  // CONDITIONAL RENDERING: Show detail view or list view
  if (selectedProject) {
    // --- PROJECT DETAIL VIEW ---
    return (
      <div>
        <button className="back-button" onClick={() => setSelectedProject(null)}>&larr; Back to All Projects</button>
        <h1 className="page-title">{selectedProject.title}</h1>
        <p><strong>Client:</strong> {selectedProject.clientId?.name}</p>
        <p><strong>Status:</strong> {selectedProject.status}</p>
        <p><strong>Description:</strong> {selectedProject.description}</p>
        
        {/* Comment Section */}
        <div className="comment-section">
          <h3>Comments</h3>
          <form onSubmit={handlePostComment} className="comment-form">
            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a new comment..."
              rows="3"
            />
            <button type="submit">Post Comment</button>
          </form>
          <div className="comment-list">
            {comments.map(comment => (
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

  // --- PROJECT LIST VIEW (DEFAULT) ---
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="add-button">+ Add Project</button>
      </div>
      <div className="data-table-container">
        <table>
          <thead>
            <tr><th>Title</th><th>Client</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project._id}>
                <td>
                  <a onClick={() => handleProjectClick(project)} className="project-link">
                    {project.title}
                  </a>
                </td>
                <td>{project.clientId?.name || 'N/A'}</td>
                <td>{project.status}</td>
                <td className="actions-cell">{/* Edit/Delete buttons would go here */}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Projects;