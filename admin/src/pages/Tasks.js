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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL;

  // State for the modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        headers: { 'x-auth-token': token },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to fetch tasks');
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openEditModal = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setEditingTask(null);
    setShowEditModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingTask(prev => ({ ...prev, [name]: value }));
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
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          status: editingTask.status,
          // Add other fields you want to edit
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update task.');
      }
      closeEditModal();
      fetchTasks(); // Refetch tasks to update the board
    } catch (err) {
      setError(err.message || 'Error updating task.');
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

      {showEditModal && editingTask && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Task</h2>
              <button className="close-button" onClick={closeEditModal}>&times;</button>
            </div>
            <form onSubmit={handleUpdateTask}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" name="title" value={editingTask.title} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={editingTask.status} onChange={handleInputChange}>
                  {columns.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              {/* You can add more fields to edit here, like description */}
              <button type="submit" className="add-button">Update Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;