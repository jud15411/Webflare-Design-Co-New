import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './Shared.css'; // For general styles
import './ProjectDetail.css'; // For project detail specific styles

function ProjectDetail() {
  const { projectId } = useParams();
  console.log('Project ID received by ProjectDetail:', projectId);
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]); // State for milestones
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(''); // For general fetch errors (e.g., project not found)
  // Consolidating API messages into apiMessage and messageType
  const [apiMessage, setApiMessage] = useState(''); // For success/error messages from API actions
  const [messageType, setMessageType] = useState(''); // 'success' or 'error' or 'info'

  // States for milestone modals
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [showEditMilestoneModal, setShowEditMilestoneModal] = useState(false);
  const [showDeleteMilestoneModal, setShowDeleteMilestoneModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', description: '', dueDate: '', status: 'Not Started' });
  const [selectedMilestone, setSelectedMilestone] = useState(null); // Milestone being edited/deleted

  const token = localStorage.getItem('token');

  // Helper to display API messages and clear after a delay
  const displayApiMessage = useCallback((msg, type) => {
    setApiMessage(msg);
    setMessageType(type);
    const timer = setTimeout(() => {
      setApiMessage('');
      setMessageType('');
    }, 5000); // Message disappears after 5 seconds
    return () => clearTimeout(timer);
  }, []);

  const fetchProjectAndMilestones = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const projectResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${projectId}`, {
        headers: { 'x-auth-token': token }
      });
      const projectData = await projectResponse.json();

      if (!projectResponse.ok) {
        throw new Error(projectData.msg || 'Failed to fetch project details. You may not have permission.');
      }
      setProject(projectData);

      if (projectData.milestones) {
        const sortedMilestones = projectData.milestones.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        setMilestones(sortedMilestones);
      } else {
        setMilestones([]);
      }

    } catch (err) {
      console.error("Error fetching project or milestones:", err);
      setError(err.message || 'Error loading project or milestones.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    fetchProjectAndMilestones();
  }, [fetchProjectAndMilestones]);

  // Handle input changes for new/edit milestone forms
  const handleMilestoneInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (showAddMilestoneModal) {
      setNewMilestone(prev => ({ ...prev, [name]: value }));
    } else if (showEditMilestoneModal) {
      setSelectedMilestone(prev => ({ ...prev, [name]: value }));
    }
  }, [showAddMilestoneModal, showEditMilestoneModal]);

  // Close all milestone modals and reset forms/messages
  const handleCloseMilestoneModals = useCallback(() => {
    setShowAddMilestoneModal(false);
    setShowEditMilestoneModal(false);
    setShowDeleteMilestoneModal(false);
    setNewMilestone({ name: '', description: '', dueDate: '', status: 'Not Started' });
    setSelectedMilestone(null);
    setApiMessage(''); // Clear any message when modal closes
    setMessageType('');
  }, []); // No dependencies, as it only sets state to initial values

  // --- Milestone Actions ---
  const handleAddMilestone = useCallback(async (e) => {
    e.preventDefault();
    setApiMessage(''); // Clear message before new action
    setMessageType('');
    try {
      const milestoneData = { ...newMilestone, projectId }; // Link milestone to current project
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(milestoneData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to add milestone.');
      }
      displayApiMessage('Milestone added successfully!', 'success');
      handleCloseMilestoneModals();
      fetchProjectAndMilestones(); // Re-fetch all data
    } catch (err) {
      console.error("Error adding milestone:", err);
      displayApiMessage(err.message || 'Error adding milestone.', 'error');
    }
  }, [newMilestone, projectId, token, handleCloseMilestoneModals, fetchProjectAndMilestones, displayApiMessage]);


  const handleUpdateMilestone = useCallback(async (e) => {
    e.preventDefault();
    setApiMessage(''); // Clear message before new action
    setMessageType('');
    if (!selectedMilestone) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/milestones/${selectedMilestone._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(selectedMilestone), // selectedMilestone state is already updated via handleMilestoneInputChange
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to update milestone.');
      }
      displayApiMessage('Milestone updated successfully!', 'success');
      handleCloseMilestoneModals();
      fetchProjectAndMilestones(); // Re-fetch all data
    } catch (err) {
      console.error("Error updating milestone:", err);
      displayApiMessage(err.message || 'Error updating milestone.', 'error');
    }
  }, [selectedMilestone, token, handleCloseMilestoneModals, fetchProjectAndMilestones, displayApiMessage]);

  const handleDeleteMilestone = useCallback(async () => {
    setApiMessage(''); // Clear message before new action
    setMessageType('');
    if (!selectedMilestone) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/milestones/${selectedMilestone._id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to delete milestone.');
      }
      displayApiMessage('Milestone deleted successfully!', 'success');
      handleCloseMilestoneModals();
      fetchProjectAndMilestones(); // Re-fetch all data
    } catch (err) {
      console.error("Error deleting milestone:", err);
      displayApiMessage(err.message || 'Error deleting milestone.', 'error');
    }
  }, [selectedMilestone, token, handleCloseMilestoneModals, fetchProjectAndMilestones, displayApiMessage]);


  if (isLoading) return <div>Loading project details...</div>;
  if (error) return <div className="error-message" style={{ padding: '20px' }}>Error: {error}</div>;
  if (!project) return <div>Project not found.</div>;

  return (
    <div className="project-detail-page">
      <div className="page-header">
        <h1 className="page-title">Project: {project.title}</h1>
        <p className="project-description">{project.description}</p>
        <p>Status: {project.status}</p>
        <p>Client: {project.clientId ? project.clientId.name : 'N/A'}</p>
      </div>

      {/* Display API success/error messages at the top of the page */}
      {apiMessage && ( 
        <div className={`message-banner ${messageType}`}>
          {apiMessage}
          <button className="close-message" onClick={() => setApiMessage('')}>X</button>
        </div>
      )}

      {/* Milestones Section */}
      <div className="milestones-section">
        <h2>Milestones</h2>
        <button className="add-button" onClick={() => setShowAddMilestoneModal(true)}>+ Add Milestone</button>
        
        <div className="data-table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Client Suggestions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {milestones.length > 0 ? (
                milestones.map(milestone => (
                  <tr key={milestone._id}>
                    <td>{milestone.name}</td>
                    <td>{new Date(milestone.dueDate).toLocaleDateString()}</td>
                    <td>{milestone.status}</td>
                    <td>{milestone.clientSuggestions || 'N/A'}</td>
                    <td className="actions-cell">
                      <button 
                        className="edit-button" 
                        onClick={() => { 
                            setSelectedMilestone(milestone); 
                            setShowEditMilestoneModal(true); 
                        }}
                      >Edit</button>
                      <button 
                        className="delete-button" 
                        onClick={() => { 
                            setSelectedMilestone(milestone); 
                            setShowDeleteMilestoneModal(true); 
                        }}
                      >Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5">No milestones defined for this project.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddMilestoneModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Milestone</h2>
              <button className="close-button" onClick={handleCloseMilestoneModals}>&times;</button>
            </div>
            {/* Display general API message from parent state here as well */}
            {apiMessage && <div className={`message-banner ${messageType}`}>{apiMessage}</div>}
            <form onSubmit={handleAddMilestone}>
              <div className="form-group"><label>Name</label><input type="text" name="name" value={newMilestone.name} onChange={handleMilestoneInputChange} required /></div>
              <div className="form-group"><label>Description</label><textarea name="description" value={newMilestone.description} onChange={handleMilestoneInputChange}></textarea></div>
              <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={newMilestone.dueDate} onChange={handleMilestoneInputChange} required /></div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={newMilestone.status} onChange={handleMilestoneInputChange}>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>
              <button type="submit" className="add-button">Create Milestone</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Milestone Modal */}
      {showEditMilestoneModal && selectedMilestone && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Milestone</h2>
              <button className="close-button" onClick={handleCloseMilestoneModals}>&times;</button>
            </div>
            {apiMessage && <div className={`message-banner ${messageType}`}>{apiMessage}</div>} {/* Display API message */}
            <form onSubmit={handleUpdateMilestone}>
              <div className="form-group"><label>Name</label><input type="text" name="name" value={selectedMilestone.name} onChange={handleMilestoneInputChange} required /></div>
              <div className="form-group"><label>Description</label><textarea name="description" value={selectedMilestone.description} onChange={handleMilestoneInputChange}></textarea></div>
              <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={selectedMilestone.dueDate ? new Date(selectedMilestone.dueDate).toISOString().split('T')[0] : ''} onChange={handleMilestoneInputChange} required /></div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={selectedMilestone.status} onChange={handleMilestoneInputChange}>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>
              <div className="form-group"><label>Client Suggestions</label><textarea name="clientSuggestions" value={selectedMilestone.clientSuggestions || ''} onChange={handleMilestoneInputChange} readOnly></textarea></div>
              <button type="submit" className="add-button">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Milestone Confirmation Modal */}
      {showDeleteMilestoneModal && selectedMilestone && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Confirm Delete Milestone</h2>
              <button className="close-button" onClick={handleCloseMilestoneModals}>&times;</button>
            </div>
            {apiMessage && <div className={`message-banner ${messageType}`}>{apiMessage}</div>} {/* Display API message */}
            <p>Are you sure you want to delete the milestone <strong>{selectedMilestone.name}</strong>? This action cannot be undone, and will unlink any tasks associated with it.</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={handleCloseMilestoneModals}>Cancel</button>
              <button className="delete-button" onClick={handleDeleteMilestone}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;