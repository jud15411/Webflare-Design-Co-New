import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Shared.css';
import './Tasks.css';

const API_URL = process.env.REACT_APP_API_URL;

// Task Card with Edit and the new Delete button
const TaskCard = ({ task, onEdit, onDelete, currentUser }) => (
    <div className="task-card">
      <h4 className="task-card-title">{task.title}</h4>
      <div className="task-card-meta">
        <span className="project-title">{task.projectId?.title || 'No Project'}</span>
        <div className="assignee-avatars">
          {task.assignedTo && task.assignedTo.length > 0 ? (
            task.assignedTo.map(user => (
              <span key={user._id} className="assignee-avatar" title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </span>
            ))
          ) : (
            <span className="assignee-avatar" title="Unassigned">?</span>
          )}
        </div>
      </div>
      <div className="task-card-actions">
        {currentUser?.role === 'CEO' && (
            <button className="delete-task-button" onClick={() => onDelete(task._id)}>🗑️</button>
        )}
        <button className="edit-task-button" onClick={() => onEdit(task)}>✏️</button>
      </div>
    </div>
);

// Task Column (No changes needed, but included for completeness)
const TaskColumn = ({ title, tasks, onEdit, onDelete, currentUser }) => (
    <div className="task-column">
      <div className={`column-header ${title.replace(/\s+/g, '-').toLowerCase()}`}>
        <h2 className="column-title">{title} ({tasks.length})</h2>
      </div>
      <div className="task-list">
        {tasks.map(task => (
          <TaskCard key={task._id} task={task} onEdit={onEdit} onDelete={onDelete} currentUser={currentUser} />
        ))}
      </div>
    </div>
);

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');

    // Your existing modal and form states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [newTask, setNewTask] = useState({ title: '', description: '', status: 'Backlog', projectId: '', assignedTo: [] });
    const [timeLog, setTimeLog] = useState('');
    
    const columns = ['Backlog', 'To Do', 'In Progress', 'Done'];

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [tasksRes, usersRes, projectsRes, currentUserRes] = await Promise.all([
                fetch(`${API_URL}/api/tasks`, { headers: { 'x-auth-token': token } }),
                fetch(`${API_URL}/api/users`, { headers: { 'x-auth-token': token } }),
                fetch(`${API_URL}/api/projects`, { headers: { 'x-auth-token': token } }),
                fetch(`${API_URL}/api/auth/user`, { headers: { 'x-auth-token': token } })
            ]);

            if (!tasksRes.ok || !usersRes.ok || !projectsRes.ok || !currentUserRes.ok) {
                throw new Error('Failed to fetch page data.');
            }
            
            const tasksData = await tasksRes.json();
            const usersData = await usersRes.json();
            const projectsData = await projectsRes.json();
            const currentUserData = await currentUserRes.json();

            setTasks(tasksData);
            setUsers(usersData);
            setProjects(projectsData);
            setCurrentUser(currentUserData);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e) => {
        const { name, value, options } = e.target;
        const targetState = showEditModal ? setEditingTask : setNewTask;
        if (name === 'assignedTo') {
            const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
            targetState(prev => ({ ...prev, [name]: selected }));
        } else {
            targetState(prev => ({ ...prev, [name]: value }));
        }
    };
    
    // --- Your Existing Add/Edit Task Handlers ---
    const handleAddTask = async (e) => { e.preventDefault(); /* ... your existing logic ... */ };
    const handleUpdateTask = async (e) => { e.preventDefault(); /* ... your existing logic ... */ };
    const openEditModal = (task) => { setEditingTask(task); setShowEditModal(true); };
    const handleCloseModals = () => { setShowAddModal(false); setShowEditModal(false); };
    
    // --- New Delete Task Handler ---
    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
        try {
            const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.msg || 'Failed to delete task.');
            }
            // On success, remove the task from the local state for an instant UI update
            setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
        } catch (err) {
            setError(err.message);
        }
    };

    if (isLoading) return <div className="loading-container">Loading Tasks...</div>;
    if (error) return <div className="error-container">{error}</div>;

    return (
        <div className="tasks-page">
            <div className="page-header">
                <h1>Tasks Board</h1>
                <button onClick={() => setShowAddModal(true)} className="add-button-small">+ Add New Task</button>
            </div>
            <div className="tasks-board">
                {columns.map(column => (
                    <TaskColumn
                        key={column}
                        title={column}
                        tasks={tasks.filter(task => task.status === column)}
                        onEdit={openEditModal}
                        onDelete={handleDeleteTask}
                        currentUser={currentUser}
                    />
                ))}
            </div>

            {/* Your Existing "Add Task" Modal JSX */}
            {showAddModal && (
              <div className="modal-backdrop">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2 className="modal-title">Add New Task</h2>
                    <button className="close-button" onClick={closeModals}>&times;</button>
                  </div>
                  <form onSubmit={handleAddTask}>
                    <div className="form-group">
                      <label>Title</label>
                      <input type="text" name="title" value={newTask.title} onChange={handleNewTaskInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea name="description" rows="3" value={newTask.description} onChange={handleNewTaskInputChange}></textarea>
                    </div>
                    <div className="form-group">
                      <label>Project</label>
                      <select name="projectId" value={newTask.projectId} onChange={handleNewTaskInputChange} required>
                        <option value="">Select Project</option>
                        {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Assign To</label>
                      <select name="assignedTo" value={newTask.assignedTo} onChange={handleNewTaskInputChange} multiple>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Due Date</label>
                      <input type="date" name="dueDate" value={newTask.dueDate} onChange={handleNewTaskInputChange} />
                    </div>
                    <button type="submit" className="add-button">Create Task</button>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Task Modal */}
            {showEditModal && editingTask && (
              <div className="modal-backdrop">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2 className="modal-title">Edit Task</h2>
                    <button className="close-button" onClick={closeModals}>&times;</button>
                  </div>
                  <form onSubmit={handleUpdateTask}>
                    <div className="form-group">
                      <label>Title</label>
                      <input type="text" name="title" value={editingTask.title} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea name="description" rows="3" value={editingTask.description || ''} onChange={handleInputChange}></textarea>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" value={editingTask.status} onChange={handleInputChange}>
                        {columns.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Assign To</label>
                      <select name="assignedTo" value={editingTask.assignedTo} onChange={handleInputChange} multiple>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group time-log-group">
                        <label>Log Time</label>
                        <div className="time-log-input-wrapper">
                          <input type="number" name="timeLog" value={timeLog} onChange={(e) => setTimeLog(e.target.value)} placeholder="e.g., 2.5" />
                          <span>hours</span>
                        </div>
                    </div>
                    <button type="submit" className="add-button">Update Task</button>
                  </form>
                </div>
              </div>
            )}
        </div>
    );
}

export default Tasks;