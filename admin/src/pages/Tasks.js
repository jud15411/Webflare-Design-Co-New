import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css';
import './Tasks.css';

const API_URL = process.env.REACT_APP_API_URL;
const columns = ['Backlog', 'To Do', 'In Progress', 'Done'];

const TaskCard = ({ task, onEdit }) => (
    <div className="task-card" onClick={() => onEdit(task)}>
      <h4 className="task-card-title">{task.title}</h4>
      <div className="task-card-meta">
        <span className="project-title">
          {task.projectId ? task.projectId.title : 'No Project'}
        </span>
        <div className="assignee-avatars">
<<<<<<< HEAD
          {task.assignedTo && task.assignedTo.length > 0 ? (
            task.assignedTo.map(user => user && user.name ? (
              <span key={user._id} className="assignee-avatar" title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </span>
            ) : null)
=======
          {/* THE FIX: Check for task.assignedTo AND task.assignedTo.name before using charAt */}
          {task.assignedTo && task.assignedTo.name ? (
            <span className="assignee-avatar" title={task.assignedTo.name}>
              {task.assignedTo.name.charAt(0).toUpperCase()}
            </span>
>>>>>>> parent of 0e2507e (big update)
          ) : (
            <span className="assignee-avatar" title="Unassigned">?</span>
          )}
        </div>
      </div>
    </div>
);

const TaskColumn = ({ title, tasks, onEdit }) => (
    <div className="task-column">
      <div className={`column-header ${title.replace(/\s+/g, '-').toLowerCase()}`}>
        <h2 className="column-title">{title} ({tasks.length})</h2>
      </div>
      <div className="task-list">
        {tasks.map(task => (
            <TaskCard key={task._id} task={task} onEdit={onEdit} />
        ))}
      </div>
    </div>
);

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
<<<<<<< HEAD
    const [timeToLog, setTimeToLog] = useState('');
=======
>>>>>>> parent of 0e2507e (big update)
    const token = localStorage.getItem('token');

    const fetchPageData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [tasksRes, usersRes, projectsRes] = await Promise.all([
                fetch(`${API_URL}/api/tasks`, { headers: { 'x-auth-token': token } }),
                fetch(`${API_URL}/api/users`, { headers: { 'x-auth-token': token } }),
                fetch(`${API_URL}/api/projects`, { headers: { 'x-auth-token': token } })
            ]);
<<<<<<< HEAD
            if (!tasksRes.ok || !usersRes.ok || !projectsRes.ok) throw new Error('Failed to fetch page data.');
=======
            if (!tasksRes.ok || !usersRes.ok || !projectsRes.ok) throw new Error('Failed to fetch data.');
>>>>>>> parent of 0e2507e (big update)
            
            const tasksData = await tasksRes.json();
            const usersData = await usersRes.json();
            const projectsData = await projectsRes.json();

            setTasks(tasksData);
            setUsers(usersData);
            setProjects(projectsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token, API_URL]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleEditClick = (task) => {
<<<<<<< HEAD
        const assignedToIds = task.assignedTo ? task.assignedTo.map(user => user._id) : [];
        setEditingTask({ ...task, assignedTo: assignedToIds, projectId: task.projectId?._id || '' });
        setTimeToLog('');
=======
        setEditingTask({ ...task, assignedTo: task.assignedTo?._id || '', projectId: task.projectId?._id || '' });
>>>>>>> parent of 0e2507e (big update)
        setShowEditModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditingTask(prev => ({ ...prev, [name]: value }));
    };

    const handleAssigneeChange = (e) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
        setEditingTask(prev => ({ ...prev, assignedTo: selectedIds }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
<<<<<<< HEAD
            const taskUpdateResponse = await fetch(`${API_URL}/api/tasks/${editingTask._id}`, {
=======
            const response = await fetch(`${API_URL}/api/tasks/${editingTask._id}`, {
>>>>>>> parent of 0e2507e (big update)
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(editingTask),
            });
<<<<<<< HEAD
            if (!taskUpdateResponse.ok) throw new Error('Failed to update task.');

            const hours = parseFloat(timeToLog);
            if (hours > 0) {
                if (!editingTask.projectId) throw new Error('Task must be assigned to a project to log time.');
                await fetch(`${API_URL}/api/timeentries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({
                        hours: hours,
                        taskId: editingTask._id,
                        projectId: editingTask.projectId,
                        description: `Time logged for task: ${editingTask.title}`
                    }),
                });
            }

            setShowEditModal(false);
            fetchPageData();
=======
            if (!response.ok) throw new Error('Failed to update task.');
            setShowEditModal(false);
            fetchPageData(); // Refresh list
>>>>>>> parent of 0e2507e (big update)
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
=======
            <div className="page-header">
                <h1>Task Board</h1>
            </div>
>>>>>>> parent of 0e2507e (big update)
            <div className="tasks-board">
                {columns.map(column => (
                    <TaskColumn key={column} title={column} tasks={tasks.filter(task => task.status === column)} onEdit={handleEditClick} />
                ))}
            </div>

            {showEditModal && editingTask && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Edit Task</h2>
                            <button onClick={() => setShowEditModal(false)} className="close-button">&times;</button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group"><label>Title</label><input name="title" value={editingTask.title} onChange={handleInputChange} required /></div>
                            <div className="form-group"><label>Description</label><textarea name="description" value={editingTask.description || ''} onChange={handleInputChange}></textarea></div>
                            <div className="form-group"><label>Project</label><select name="projectId" value={editingTask.projectId} onChange={handleInputChange}><option value="">No Project</option>{projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}</select></div>
                            <div className="form-group"><label>Status</label><select name="status" value={editingTask.status} onChange={handleInputChange}>{columns.map(status => <option key={status} value={status}>{status}</option>)}</select></div>
                            <div className="form-group">
<<<<<<< HEAD
                                <label>Assign To (select multiple)</label>
                                <select name="assignedTo" value={editingTask.assignedTo} onChange={handleAssigneeChange} multiple size="4">
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group time-log-group"><label>Log Time for this Task</label><div className="time-log-input-wrapper"><input type="number" step="0.1" min="0" value={timeToLog} onChange={(e) => setTimeToLog(e.target.value)} placeholder="e.g., 2.5" /><span>hours</span></div></div>
                            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowEditModal(false)}>Cancel</button><button type="submit" className="submit-button">Update Task</button></div>
=======
                                <label>Title</label>
                                <input name="title" value={editingTask.title} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea name="description" value={editingTask.description || ''} onChange={handleInputChange}></textarea>
                            </div>
                             <div className="form-group">
                                <label>Project</label>
                                <select name="projectId" value={editingTask.projectId} onChange={handleInputChange}>
                                    <option value="">No Project</option>
                                    {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={editingTask.status} onChange={handleInputChange}>
                                    {columns.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Assign To</label>
                                <select name="assignedTo" value={editingTask.assignedTo} onChange={handleInputChange}>
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-button" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="submit-button">Update Task</button>
                            </div>
>>>>>>> parent of 0e2507e (big update)
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Tasks;