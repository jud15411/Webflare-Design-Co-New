import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Shared.css';
import './Tasks.css';

const API_URL = process.env.REACT_APP_API_URL;
<<<<<<< HEAD
const columns = ['Backlog', 'To Do', 'In Progress', 'Done'];

const TaskCard = ({ task, onEdit }) => (
    <div className="task-card" onClick={() => onEdit(task)}>
      <h4 className="task-card-title">{task.title}</h4>
      <div className="task-card-meta">
        <span className="project-title">{task.projectId ? task.projectId.title : 'No Project'}</span>
        <div className="assignee-avatars">
          {/* Updated to map over the assignedTo array */}
          {task.assignedTo && task.assignedTo.length > 0 ? (
            task.assignedTo.map(user => user && user.name ? (
              <span key={user._id} className="assignee-avatar" title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </span>
            ) : null)
          ) : (
            <span className="assignee-avatar unassigned" title="Unassigned">?</span>
          )}
        </div>
      </div>
    </div>
);

const TaskColumn = ({ title, tasks, onEdit }) => (
    <div className="task-column">
      <div className={`column-header ${title.replace(/\s+/g, '-').toLowerCase()}`}>
        <h2 className="column-title">{title} <span className="task-count">({tasks.length})</span></h2>
      </div>
      <div className="task-list">
        {tasks.map(task => (<TaskCard key={task._id} task={task} onEdit={onEdit} />))}
      </div>
    </div>
);
=======
>>>>>>> parent of b0383fd (update)

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
<<<<<<< HEAD
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [timeToLog, setTimeToLog] = useState('');
=======
>>>>>>> parent of b0383fd (update)
    const token = localStorage.getItem('token');

    // State for the "Add Task" modal
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        status: 'Backlog',
        projectId: '',
        assignedTo: []
    });

    const fetchPageData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [tasksRes, userRes, usersRes, projectsRes] = await Promise.all([
                fetch(`${API_URL}/api/tasks`, { headers: { 'x-auth-token': token } }),
                fetch(`${API_URL}/api/auth/user`, { headers: { 'x-auth-token': token } }),
                fetch(`${API_URL}/api/users`, { headers: { 'x-auth-token': token } }),
                fetch(`${API_URL}/api/projects`, { headers: { 'x-auth-token': token } })
            ]);
<<<<<<< HEAD
            if (!tasksRes.ok || !usersRes.ok || !projectsRes.ok) throw new Error('Failed to fetch page data.');
=======

            if (!tasksRes.ok || !userRes.ok || !usersRes.ok || !projectsRes.ok) {
                throw new Error('Failed to fetch data. Please log in again.');
            }
>>>>>>> parent of b0383fd (update)
            
            const tasksData = await tasksRes.json();
            const userData = await userRes.json();
            const usersData = await usersRes.json();
            const projectsData = await projectsRes.json();

            setTasks(tasksData);
            setCurrentUser(userData);
            setUsers(usersData);
            setProjects(projectsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);
<<<<<<< HEAD

    const handleEditClick = (task) => {
        // Prepare assignedTo as an array of IDs for the multi-select form
        const assignedToIds = task.assignedTo ? task.assignedTo.map(user => user._id) : [];
        setEditingTask({ ...task, assignedTo: assignedToIds, projectId: task.projectId?._id || '' });
        setTimeToLog('');
        setShowEditModal(true);
    };

    const handleInputChange = (e) => {
=======
    
    // --- THE FIX: These functions were missing ---
    const handleNewTaskInputChange = (e) => {
>>>>>>> parent of b0383fd (update)
        const { name, value } = e.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
    };

<<<<<<< HEAD
    // Special handler for the multi-select assignee dropdown
    const handleAssigneeChange = (e) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
        setEditingTask(prev => ({ ...prev, assignedTo: selectedIds }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const taskUpdateResponse = await fetch(`${API_URL}/api/tasks/${editingTask._id}`, {
                method: 'PUT',
=======
    const closeModals = () => {
        setShowAddTaskModal(false);
    };
    // ---------------------------------------------

    const handleNewTaskSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/tasks`, {
                method: 'POST',
>>>>>>> parent of b0383fd (update)
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(newTask),
            });
<<<<<<< HEAD
            if (!taskUpdateResponse.ok) throw new Error('Failed to update task.');

            const hours = parseFloat(timeToLog);
            if (hours > 0) {
                if (!editingTask.projectId) throw new Error('Task must be assigned to a project to log time.');
                const timeEntryResponse = await fetch(`${API_URL}/api/timeentries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({
                        hours: hours,
                        taskId: editingTask._id,
                        projectId: editingTask.projectId,
                        description: `Time logged for task: ${editingTask.title}`
                    }),
                });
                if (!timeEntryResponse.ok) throw new Error('Task updated, but failed to log time.');
            }

            setShowEditModal(false);
            fetchPageData();
=======
            if (!response.ok) throw new Error('Failed to create task.');
            closeModals(); // Close modal on success
            fetchPageData(); // Refresh task list
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
        try {
            const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (!response.ok) throw new Error('Failed to delete task.');
            fetchPageData(); // Refresh the task list
>>>>>>> parent of b0383fd (update)
        } catch (err) {
            setError(err.message);
        }
    };

    if (isLoading) return <div className="loading-container">Loading Tasks...</div>;
    if (error) return <div className="error-container">{error}</div>;

    return (
        <div className="tasks-page">
<<<<<<< HEAD
            <div className="page-header"><h1>Task Board</h1></div>
            {error && <p className="error-message">{error}</p>}
            <div className="tasks-board">
                {columns.map(column => (
                    <TaskColumn key={column} title={column} tasks={tasks.filter(task => task.status === column)} onEdit={handleEditClick} />
                ))}
=======
            <div className="page-header">
                <h1>All Tasks</h1>
                <button onClick={() => setShowAddTaskModal(true)} className="add-button-small">+ Add New Task</button>
>>>>>>> parent of b0383fd (update)
            </div>

            <div className="task-list-container">
                <table className="tasks-table">
                    <thead>
                        <tr>
                            <th>Task Title</th>
                            <th>Project</th>
                            <th>Assigned To</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.length > 0 ? tasks.map(task => (
                            <tr key={task._id}>
                                <td>{task.title}</td>
                                <td>{task.projectId?.title || 'N/A'}</td>
                                <td>{task.assignedTo?.name || 'Unassigned'}</td>
                                <td><span className={`status status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>{task.status}</span></td>
                                <td className="task-actions">
                                    {currentUser?.role === 'CEO' && (
                                        <button onClick={() => handleDeleteTask(task._id)} className="delete-button-small">
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="empty-table-cell">No tasks found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add New Task Modal */}
            {showAddTaskModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add New Task</h2>
                            <button onClick={closeModals} className="close-button">&times;</button>
                        </div>
<<<<<<< HEAD
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group"><label>Title</label><input name="title" value={editingTask.title} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label>Description</label><textarea name="description" value={editingTask.description || ''} onChange={handleInputChange}></textarea></div>
                            <div className="form-group"><label>Project</label><select name="projectId" value={editingTask.projectId} onChange={handleInputChange}><option value="">No Project</option>{projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}</select></div>
                            <div className="form-group"><label>Status</label><select name="status" value={editingTask.status} onChange={handleInputChange}>{columns.map(status => <option key={status} value={status}>{status}</option>)}</select></div>
                            <div className="form-group">
                                <label>Assign To (select multiple)</label>
                                {/* Updated to a multi-select dropdown */}
                                <select name="assignedTo" value={editingTask.assignedTo} onChange={handleAssigneeChange} multiple size="4">
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group time-log-group"><label>Log Time for this Task</label><div className="time-log-input-wrapper"><input type="number" step="0.1" min="0" value={timeToLog} onChange={(e) => setTimeToLog(e.target.value)} placeholder="e.g., 2.5" /><span>hours</span></div></div>
                            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowEditModal(false)}>Cancel</button><button type="submit" className="submit-button">Update Task</button></div>
=======
                        <form onSubmit={handleNewTaskSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input name="title" value={newTask.title} onChange={handleNewTaskInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea name="description" value={newTask.description} onChange={handleNewTaskInputChange}></textarea>
                            </div>
                            <div className="form-group">
                                <label>Project</label>
                                <select name="projectId" value={newTask.projectId} onChange={handleNewTaskInputChange} required>
                                    <option value="">Select a Project</option>
                                    {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Assign To</label>
                                <select name="assignedTo" value={newTask.assignedTo} onChange={handleNewTaskInputChange}>
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={newTask.status} onChange={handleNewTaskInputChange}>
                                    <option>Backlog</option>
                                    <option>To Do</option>
                                    <option>In Progress</option>
                                    <option>Done</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-button" onClick={closeModals}>Cancel</button>
                                <button type="submit" className="submit-button">Create Task</button>
                            </div>
>>>>>>> parent of b0383fd (update)
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Tasks;