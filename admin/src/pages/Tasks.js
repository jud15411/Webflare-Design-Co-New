// admin/src/pages/Tasks.js

import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css';
import './Tasks.css';

// Task Card Component
const TaskCard = ({ task, onEdit }) => (
  <div className="task-card">
    <h4 className="task-card-title">{task.title}</h4>
    <div className="task-card-meta">
      <span className="project-title">
        {task.projectId ? task.projectId.title : 'No Project'}
      </span>
      <span className="assignee-avatar" title={task.assignedTo ? task.assignedTo.name : 'Unassigned'}>
        {task.assignedTo ? task.assignedTo.name.charAt(0).toUpperCase() : '?'}
      </span>
    </div>
    <button className="edit-task-button" onClick={() => onEdit(task)}>✏️</button>
  </div>
);

// Task Column Component
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
  const [projects, setProjects] = useState([]); // For dropdown in add modal
  const [users, setUsers] = useState([]); // For dropdown in add modal
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL;

  // State for the modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    dueDate: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch tasks, projects, and users in parallel
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/tasks`, { headers: { 'x-auth-token': token } }),
        fetch(`${API_URL}/api/projects`, { headers: { 'x-auth-token': token } }),
        fetch(`${API_URL}/api/users`, { headers: { 'x-auth-token': token } })
      ]);

      if (!tasksRes.ok || !projectsRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch all required data.');
      }

      const tasksData = await tasksRes.json();
      const projectsData = await projectsRes.json();
      const usersData = await usersRes.json();

      setTasks(tasksData);
      setProjects(projectsData);
      setUsers(usersData);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEditModal = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowEditModal(false);
    setEditingTask(null);
    setShowAddModal(false);
    setNewTask({ title: '', description: '', projectId: '', assignedTo: '', dueDate: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingTask(prev => ({ ...prev, [name]: value }));
  };

  const handleNewTaskInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const response = await fetch(`${API_URL}/api/tasks/${editingTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(editingTask),
      });
      if (!response.ok) throw new Error('Failed to update task.');
      
      closeModals();
      fetchData(); // Refetch all data
    } catch (err) {
      setError(err.message || 'Error updating task.');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify(newTask),
      });
      if (!response.ok) throw new Error('Failed to add task.');
      
      closeModals();
      fetchData(); // Refetch all data
    } catch (err) {
      setError(err.message || 'Error adding task.');
    }
  };

  const columns = ['Backlog', 'To Do', 'In Progress', 'Done'];
  const tasksByColumn = (columnName) => {
    return tasks.filter(task => task.status === columnName);
  };

  if (isLoading) return <div className="loading-message">Loading tasks...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h1 className="page-title">Task Board</h1>
        <button className="add-button" onClick={() => setShowAddModal(true)}>+ Add Task</button>
      </div>

      <div className="tasks-board">
        {columns.map(columnName => (
          <TaskColumn
            key={columnName}
            title={columnName}
            tasks={tasksByColumn(columnName)}
            onEdit={openEditModal}
          />
        ))}
      </div>

      {/* Add Task Modal */}
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
                <select name="assignedTo" value={newTask.assignedTo} onChange={handleNewTaskInputChange}>
                  <option value="">Unassigned</option>
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
                <textarea name="description" rows="3" value={editingTask.description} onChange={handleInputChange}></textarea>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={editingTask.status} onChange={handleInputChange}>
                  {columns.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
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