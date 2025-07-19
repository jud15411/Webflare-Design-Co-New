import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Shared.css';
import './Tasks.css';

const API_URL = process.env.REACT_APP_API_URL;

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
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

            if (!tasksRes.ok || !userRes.ok || !usersRes.ok || !projectsRes.ok) {
                throw new Error('Failed to fetch data. Please log in again.');
            }
            
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
    
    // --- THE FIX: These functions were missing ---
    const handleNewTaskInputChange = (e) => {
        const { name, value } = e.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
    };

    const closeModals = () => {
        setShowAddTaskModal(false);
    };
    // ---------------------------------------------

    const handleNewTaskSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(newTask),
            });
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
        } catch (err) {
            setError(err.message);
        }
    };

    if (isLoading) return <div className="loading-container">Loading Tasks...</div>;
    if (error) return <div className="error-container">{error}</div>;

    return (
        <div className="tasks-page">
            <div className="page-header">
                <h1>All Tasks</h1>
                <button onClick={() => setShowAddTaskModal(true)} className="add-button-small">+ Add New Task</button>
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
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Tasks;