import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Shared.css';
import './ProjectDetail.css';

const API_URL = process.env.REACT_APP_API_URL;

function ProjectDetail() {
    const { projectId } = useParams();
    const [projectData, setProjectData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [apiMessage, setApiMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    // State for forms
    const [newComment, setNewComment] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
    const [newMilestone, setNewMilestone] = useState({ name: '', description: '', dueDate: '' });

    const token = localStorage.getItem('token');

    const fetchAllProjectData = useCallback(async () => {
        // Don't set loading to true here, so the page doesn't flicker on refresh
        try {
            const response = await fetch(`${API_URL}/api/projects/${projectId}/details`, {
                headers: { 'x-auth-token': token }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.msg || `Server error: ${response.status}`);
            }
            const data = await response.json();
            setProjectData(data);
        } catch (err) {
            setError(err.message);
        }
    }, [projectId, token]);

    useEffect(() => {
        setIsLoading(true);
        fetchAllProjectData().finally(() => setIsLoading(false));
    }, [fetchAllProjectData]);

    const handleMessage = (msg, type) => {
        setApiMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setApiMessage('');
            setMessageType('');
        }, 3000);
    };
    
    // --- Milestone Handlers ---
    const handleMilestoneInputChange = (e) => {
        const { name, value } = e.target;
        setNewMilestone(prev => ({ ...prev, [name]: value }));
    };

    const handleAddMilestone = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/projects/${projectId}/milestones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(newMilestone),
            });
            if (!response.ok) throw new Error('Failed to add milestone.');
            setShowAddMilestoneModal(false);
            setNewMilestone({ name: '', description: '', dueDate: '' }); // Reset form
            await fetchAllProjectData(); // Refresh data
            handleMessage('Milestone added successfully!', 'success');
        } catch (err) {
            handleMessage(err.message, 'error');
        }
    };

    // --- File Handlers ---
    const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

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
            if (!response.ok) throw new Error('File upload failed.');
            setSelectedFile(null);
            document.getElementById('file-input').value = null; // Clear file input
            await fetchAllProjectData(); // Refresh data
            handleMessage('File uploaded successfully!', 'success');
        } catch (err) {
            handleMessage(err.message, 'error');
        }
    };

    // --- Comment Handlers ---
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
            setNewComment('');
            await fetchAllProjectData(); // Refresh data
        } catch (err) {
            handleMessage(err.message, 'error');
        }
    };

    if (isLoading) return <div className="loading-container">Loading Project Details...</div>;
    if (error) return <div className="error-container"><h2>{error}</h2><Link to="/projects">Go Back</Link></div>;

    return (
        <div className="project-detail-page">
            <Link to="/projects" className="back-button">← Back to All Projects</Link>
            {apiMessage && <div className={`api-message ${messageType}`}>{apiMessage}</div>}

            <div className="page-header">
                <h1 className="page-title">{projectData?.project?.title}</h1>
                <p><strong>Client:</strong> {projectData?.project?.clientId?.name || 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`status status-${projectData?.project?.status.toLowerCase().replace(' ', '-')}`}>{projectData?.project?.status}</span></p>
            </div>
            
            <p className="project-description">{projectData?.project?.description}</p>
            
            {/* Milestones Section */}
            <div className="detail-section">
                <div className="section-header">
                    <h2>Milestones</h2>
                    <button onClick={() => setShowAddMilestoneModal(true)} className="add-button-small">+ Add Milestone</button>
                </div>
                <div className="milestone-list">
                    {projectData?.milestones?.length > 0 ? projectData.milestones.map(m => (
                        <div key={m._id} className="milestone-item">
                           <p><strong>{m.name}</strong> - Due: {new Date(m.dueDate).toLocaleDateString()}</p>
                           <span className={`status status-${m.status.toLowerCase().replace(' ', '-')}`}>{m.status}</span>
                        </div>
                    )) : <p>No milestones have been added to this project yet.</p>}
                </div>
            </div>
            
            {/* Files Section */}
            <div className="detail-section">
                <div className="section-header">
                    <h2>Project Files</h2>
                </div>
                <div className="file-upload-form">
                    <input type="file" id="file-input" onChange={handleFileChange} />
                    <button onClick={handleFileUpload} disabled={!selectedFile} className="upload-button">Upload File</button>
                </div>
                <ul className="file-list">
                    {projectData?.files?.length > 0 ? projectData.files.map(file => (
                        <li key={file._id}>
                           <a href={`${API_URL}${file.path}`} target="_blank" rel="noopener noreferrer">{file.originalName}</a>
                           <span> ({(file.size / 1024).toFixed(2)} KB)</span>
                        </li>
                    )) : <p>No files have been uploaded for this project.</p>}
                </ul>
            </div>

            {/* Comments Section */}
            <div className="detail-section">
                <h2>Comments</h2>
                <form onSubmit={handleCommentSubmit} className="comment-form">
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..."></textarea>
                    <button type="submit">Post Comment</button>
                </form>
                <div className="comment-list">
                    {projectData?.comments?.length > 0 ? projectData.comments.map(comment => (
                        <div key={comment._id} className="comment-item">
                            <p className="comment-author">{comment.author?.name || 'User'} <span>on {new Date(comment.createdAt).toLocaleString()}</span></p>
                            <p className="comment-text">{comment.text}</p>
                        </div>
                    )) : <p>Be the first to comment on this project.</p>}
                </div>
            </div>
            
            {/* Add Milestone Modal */}
            {showAddMilestoneModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">Add New Milestone</h2>
                            <button className="close-button" onClick={() => setShowAddMilestoneModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddMilestone}>
                            <div className="form-group"><label>Milestone Name</label><input type="text" name="name" value={newMilestone.name} onChange={handleMilestoneInputChange} required /></div>
                            <div className="form-group"><label>Description</label><textarea name="description" rows="3" value={newMilestone.description} onChange={handleMilestoneInputChange}></textarea></div>
                            <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={newMilestone.dueDate} onChange={handleMilestoneInputChange} required /></div>
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