import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './Shared.css';
import './Tasks.css';

// Task Card now has an onEdit prop to make it clickable
const TaskCard = ({ task, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div className="task-card" onClick={() => onEdit(task)} ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <h4>{task.title}</h4>
      <p className="task-project-name">{task.projectId?.title}</p>
      <p className="task-assignee">{task.assignedTo?.name || 'Unassigned'}</p>
    </div>
  );
};

// TaskColumn now passes the onEdit function down to the card
const TaskColumn = ({ id, title, tasks, onEdit }) => {
  const { setNodeRef } = useSortable({ id });
  return (
    <div className="task-column">
      <h2>{title} ({tasks.length})</h2>
      <SortableContext id={id} items={tasks} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="tasks-container">
          {tasks.map(task => <TaskCard key={task._id} task={task} onEdit={onEdit} />)}
        </div>
      </SortableContext>
    </div>
  );
};

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // State for forms
  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: '', assignedTo: '' });
  
  const token = localStorage.getItem('token');

  const fetchData = useCallback(async () => { /* ... (no changes needed) */ }, [token]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDragEnd = async (event) => { /* ... (no changes needed) */ };
  const handleAddInputChange = (e) => { setNewTask({ ...newTask, [e.target.name]: e.target.value }); };
  const handleAddTask = async (e) => { /* ... (no changes needed) */ };

  // --- NEW FUNCTIONS FOR EDITING ---
  const openEditModal = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    setEditingTask({ ...editingTask, [e.target.name]: e.target.value });
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    await fetch(`${process.env.REACT_APP_API_URL}/api/tasks/${editingTask._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify(editingTask)
    });
    setShowEditModal(false);
    setEditingTask(null);
    fetchData();
  };
  
  const columns = ['To Do', 'In Progress', 'On Hold', 'Done'];
  const tasksByColumn = (columnName) => tasks.filter(task => task.status === columnName);

  if (isLoading) return <div>Loading tasks...</div>;

  return (
    <div>
      <div className="page-header">{/*...*/}</div>

      {/* Add Task Modal (no changes) */}
      {showAddModal && <div className="modal-backdrop">{/*...*/}</div>}

      {/* --- NEW EDIT TASK MODAL --- */}
      {showEditModal && editingTask && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Task</h2>
              <button className="close-button" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateTask}>
              <div className="form-group">
                <label>Task Title</label>
                <input type="text" name="title" value={editingTask.title} onChange={handleEditInputChange} required />
              </div>
              <div className="form-group">
                <label>Assign to Project</label>
                <select name="projectId" value={editingTask.projectId?._id || editingTask.projectId} onChange={handleEditInputChange} required>
                  <option value="">Select a Project</option>
                  {projects.map(project => (<option key={project._id} value={project._id}>{project.title}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" rows="3" value={editingTask.description} onChange={handleEditInputChange}></textarea>
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select name="assignedTo" value={editingTask.assignedTo?._id || editingTask.assignedTo} onChange={handleEditInputChange}>
                  <option value="">Unassigned</option>
                  {users.map(user => (<option key={user._id} value={user._id}>{user.name}</option>))}
                </select>
              </div>
              <button type="submit" className="add-button">Update Task</button>
            </form>
          </div>
        </div>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="task-board-container">
          {columns.map(columnName => (
            <TaskColumn 
              key={columnName} 
              id={columnName} 
              title={columnName} 
              tasks={tasksByColumn(columnName)} 
              onEdit={openEditModal} // Pass the function down
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

export default Tasks;