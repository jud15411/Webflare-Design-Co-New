import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Shared.css';
import './ProjectDetail.css';

const API_URL = process.env.REACT_APP_API_URL;

function ProjectDetail() {
    const { projectId } = useParams();
    const [projectData, setProjectData] = useState(null); // Single state object for all data
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [newComment, setNewComment] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const token = localStorage.getItem('token');

    // Single, robust function to fetch all data
    const fetchAllProjectData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // **THE FIX:** Make only one API call to the new '/details' endpoint
            const response = await fetch(`${API_URL}/api/projects/${projectId}/details`, {
                headers: { 'x-auth-token': token }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.msg || `Server responded with status: ${response.status}`);
            }

            const data = await response.json();
            setProjectData(data); // Set all data at once

        } catch (err) {
            console.error("Failed to fetch project details:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, token]);

    useEffect(() => {
        fetchAllProjectData();
    }, [fetchAllProjectData]);

    // Form submission logic remains largely the same but relies on fetchAllProjectData to refresh
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        // ... (Your comment submission logic)
        // After successful submission, call fetchAllProjectData() to get the latest data.
        fetchAllProjectData();
    };

    const handleFileUpload = async () => {
        // ... (Your file upload logic)
        // After successful upload, call fetchAllProjectData() to get the latest data.
        fetchAllProjectData();
    };
    
    // ... (rest of your component logic)

    if (isLoading) return <div className="loading-container">Loading Project Details...</div>;
    if (error) return <div className="error-container"><h2>Failed to Load Project</h2><p>{error}</p><Link to="/projects">Go Back</Link></div>;

    // Render component using the single projectData state
    return (
        <div className="project-detail-page">
            <Link to="/projects" className="back-button">← Back to Projects</Link>
            
            <div className="page-header">
                <h1 className="page-title">{projectData?.project?.title || 'Project Title'}</h1>
            </div>

            <div className="project-meta-data">
                <h3>Project Details</h3>
                <p><strong>Status:</strong> <span className={`status status-${projectData?.project?.status.toLowerCase()}`}>{projectData?.project?.status}</span></p>
                <p><strong>Client:</strong> {projectData?.project?.clientId?.name || 'N/A'}</p>
                <p><strong>Description:</strong> {projectData?.project?.description || 'No description.'}</p>
            </div>

            <div className="file-section">
                <h3>Project Files</h3>
                <ul>
                    {projectData?.files?.length > 0 ? projectData.files.map(file => (
                        <li key={file._id}>
                           <a href={`${API_URL}${file.path}`} target="_blank" rel="noopener noreferrer">{file.originalName}</a>
                        </li>
                    )) : <p>No files.</p>}
                </ul>
            </div>

            <div className="comment-section">
                <h3>Comments</h3>
                {projectData?.comments?.length > 0 ? projectData.comments.map(comment => (
                    <div key={comment._id} className="comment-item">
                        <p><strong>{comment.author?.name}</strong>: {comment.text}</p>
                    </div>
                )) : <p>No comments.</p>}
            </div>
        </div>
    );
}

export default ProjectDetail;