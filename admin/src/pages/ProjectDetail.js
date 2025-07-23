import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Shared.css';
import './ProjectDetail.css';

const API_URL = process.env.REACT_APP_API_URL;

function ProjectDetail() {
    const { projectId } = useParams();
    const [projectData, setProjectData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [apiMessage, setApiMessage] = useState({ text: '', type: '' });

    // State for forms
    const [newComment, setNewComment] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
    const [newMilestone, setNewMilestone] = useState({ name: '', description: '', dueDate: '' });
    
    const token = localStorage.getItem('token');

    // --- Data Fetching ---
    const fetchAllProjectData = useCallback(async () => {
        try {
            const [projectDetailsRes, currentUserRes] = await Promise.all([
                fetch(`${API_URL}/api/projects/${projectId}/details`, { headers: { 'x-auth-token': token } }),
                fetch(`${API_URL}/api/auth/user`, { headers: { 'x-auth-token': token } })
            ]);
            if (!projectDetailsRes.ok || !currentUserRes.ok) {
                throw new Error('Failed to load project data. Your session may have expired.');
            }
            const detailsData = await projectDetailsRes.json();
            const userData = await currentUserRes.json();
            setProjectData(detailsData);
            setCurrentUser(userData);
        } catch (err) {
            setError(err.message);
        }
    }, [projectId, token]);

    useEffect(() => {
        setIsLoading(true);
        fetchAllProjectData().finally(() => setIsLoading(false));
    }, [fetchAllProjectData]);

    const handleMessage = (text, type) => {
        setApiMessage({ text, type });
        setTimeout(() => setApiMessage({ text: '', type: '' }), 4000);
    };

    // --- THE FIX: This function was missing ---
    const handleMilestoneInputChange = (e) => {
        const { name, value } = e.target;
        setNewMilestone(prev => ({ ...prev, [name]: value }));
    };

    // --- All Other Handlers ---
    const handleMilestoneStatusChange = async (milestoneId, newStatus) => {
        try {
            const res = await fetch(`${API_URL}/api/milestones/${milestoneId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Failed to update status.');
            await fetchAllProjectData();
            handleMessage('Milestone status updated!', 'success');
        } catch (err) { handleMessage(err.message, 'error'); }
    };

    const handleDeleteFile = async (fileId) => {
        if (!window.confirm('Are you sure you want to permanently delete this file?')) return;
        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}/files/${fileId}`, {
                method: 'DELETE', headers: { 'x-auth-token': token }
            });
            if (!res.ok) throw new Error('Failed to delete file.');
            await fetchAllProjectData();
            handleMessage('File deleted successfully.', 'success');
        } catch (err) { handleMessage(err.message, 'error'); }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}/comments/${commentId}`, {
                method: 'DELETE', headers: { 'x-auth-token': token }
            });
            if (!res.ok) throw new Error('Failed to delete comment.');
            await fetchAllProjectData();
        } catch (err) { handleMessage(err.message, 'error'); }
    };
    
    const handleAddMilestone = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}/milestones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(newMilestone),
            });
            if (!res.ok) throw new Error('Failed to add milestone.');
            setShowAddMilestoneModal(false);
            setNewMilestone({ name: '', description: '', dueDate: '' });
            await fetchAllProjectData();
            handleMessage('Milestone added successfully!', 'success');
        } catch (err) { handleMessage(err.message, 'error'); }
    };

    const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

    const handleFileUpload = async () => {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append('projectFile', selectedFile);
        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}/files`, {
                method: 'POST', headers: { 'x-auth-token': token }, body: formData,
            });
            if (!res.ok) throw new Error('File upload failed.');
            setSelectedFile(null);
            document.getElementById('file-input').value = null;
            await fetchAllProjectData();
            handleMessage('File uploaded successfully!', 'success');
        } catch (err) { handleMessage(err.message, 'error'); }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ text: newComment }),
            });
            if (!res.ok) throw new Error('Failed to post comment.');
            setNewComment('');
            await fetchAllProjectData();
        } catch (err) { handleMessage(err.message, 'error'); }
    };

    if (isLoading) return <div className="loading-container">Loading Project Details...</div>;
    if (error) return <div className="error-container"><h2>{error}</h2><Link to="/projects">Go Back</Link></div>;

    return (
        <div className="project-detail-page">
            <Link to="/projects" className="back-button">← Back to All Projects</Link>
            {apiMessage.text && <div className={`api-message ${apiMessage.type}`}>{apiMessage.text}</div>}

            <div className="page-header">
                <h1 className="page-title">{projectData?.project?.title}</h1>
                <p><strong>Client:</strong> {projectData?.project?.clientId?.name || 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`status status-${projectData?.project?.status.toLowerCase().replace(/\s+/g, '-')}`}>{projectData?.project?.status}</span></p>
            </div>
            
            <p className="project-description">{projectData?.project?.description}</p>
            
            <div className="detail-section">
                <div className="section-header">
                    <h2>Milestones</h2>
                    <button onClick={() => setShowAddMilestoneModal(true)} className="add-button-small">+ Add Milestone</button>
                </div>
                <div className="milestone-list">
                    {projectData?.milestones?.length > 0 ? projectData.milestones.map(m => (
                        <div key={m._id} className="milestone-item">
                           <div className="milestone-info">
                               <p><strong>{m.name}</strong> - Due: {new Date(m.dueDate).toLocaleDateString()}</p>
                           </div>
                           <select value={m.status} onChange={(e) => handleMilestoneStatusChange(m._id, e.target.value)} className={`milestone-status-select status-${m.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                <option>Not Started</option><option>In Progress</option><option>Completed</option><option>On Hold</option><option>Canceled</option>
                           </select>
                        </div>
                    )) : <p>No milestones added yet.</p>}
                </div>
            </div>
            
            <div className="detail-section">
                <div className="section-header"><h2>Project Files</h2></div>
                <div className="file-upload-form"><input type="file" id="file-input" onChange={handleFileChange} /><button onClick={handleFileUpload} disabled={!selectedFile} className="upload-button">Upload File</button></div>
                <ul className="file-list">
                    {projectData?.files?.length > 0 ? projectData.files.map(file => (
                        <li key={file._id} className="file-item">
                           <div><a href={`${API_URL}${file.path}`} target="_blank" rel="noopener noreferrer">{file.originalName}</a><span> ({(file.size / 1024).toFixed(2)} KB)</span></div>
                           {currentUser?.role === 'CEO' && <button onClick={() => handleDeleteFile(file._id)} className="delete-button-small">Delete</button>}
                        </li>
                    )) : <p>No files uploaded.</p>}
                </ul>
            </div>

            <div className="detail-section">
                <h2>Comments</h2>
                <form onSubmit={handleCommentSubmit} className="comment-form"><textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..."></textarea><button type="submit">Post</button></form>
                <div className="comment-list">
                    {projectData?.comments?.length > 0 ? projectData.comments.map(comment => (
                        <div key={comment._id} className="comment-item">
                            <div><p className="comment-author">{comment.author?.name || 'User'}<span> on {new Date(comment.createdAt).toLocaleString()}</span></p><p className="comment-text">{comment.text}</p></div>
                            {currentUser?.role === 'CEO' && <button onClick={() => handleDeleteComment(comment._id)} className="delete-button-small">Delete</button>}
                        </div>
                    )) : <p>Be the first to comment.</p>}
                </div>
            </div>
            
            {showAddMilestoneModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header"><h2 className="modal-title">Add New Milestone</h2><button className="close-button" onClick={() => setShowAddMilestoneModal(false)}>&times;</button></div>
                        <form onSubmit={handleAddMilestone}>
                            <div className="form-group"><label>Name</label><input type="text" name="name" value={newMilestone.name} onChange={handleMilestoneInputChange} required /></div>
                            <div className="form-group"><label>Description</label><textarea name="description" value={newMilestone.description} onChange={handleMilestoneInputChange}></textarea></div>
                            <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={newMilestone.dueDate} onChange={handleMilestoneInputChange} required /></div>
                            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowAddMilestoneModal(false)}>Cancel</button><button type="submit">Add</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectDetail;