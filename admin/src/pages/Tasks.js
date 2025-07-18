import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './Shared.css';
import './Tasks.css';

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const API_URL = process.env.REACT_APP_API_URL;

  // Added 'Backlog' as the first column
  const initialColumns = {
    'Backlog': { id: 'Backlog', title: 'Backlog', taskIds: [] },
    'To Do': { id: 'To Do', title: 'To Do', taskIds: [] },
    'In Progress': { id: 'In Progress', title: 'In Progress', taskIds: [] },
    'Done': { id: 'Done', title: 'Done', taskIds: [] },
  };

  const [columns, setColumns] = useState(initialColumns);

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
      
      const newColumns = JSON.parse(JSON.stringify(initialColumns));
      data.forEach(task => {
        if (newColumns[task.status]) {
          newColumns[task.status].taskIds.push(task._id);
        }
      });
      setColumns(newColumns);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL]); // initialColumns is stable

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const start = columns[source.droppableId];
    const finish = columns[destination.droppableId];
    const newStatus = finish.id;

    // Optimistic UI Update
    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...start, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, taskIds: finishTaskIds };

    setColumns(prev => ({
      ...prev,
      [newStart.id]: newStart,
      [newFinish.id]: newFinish,
    }));

    // API Call to update task status
    try {
      const response = await fetch(`${API_URL}/api/tasks/${draggableId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update task status.');
      }
    } catch (err) {
      // Revert UI on error
      setError('Failed to update status. Please try again.');
      setColumns(columns); // Revert to original state
    }
  };

  const getAssigneeInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  if (isLoading) return <div className="loading-message">Loading tasks...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h1 className="page-title">Task Board</h1>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="tasks-board">
          {Object.values(columns).map(column => (
            <div key={column.id} className="task-column">
              <div className={`column-header ${column.id.replace(/\s+/g, '-').toLowerCase()}`}>
                <h2 className="column-title">{column.title}</h2>
              </div>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`task-list ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
                  >
                    {column.taskIds.map((taskId, index) => {
                      const task = tasks.find(t => t._id === taskId);
                      if (!task) return null;
                      return (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="task-card"
                            >
                              <h4 className="task-card-title">{task.title}</h4>
                              <div className="task-card-meta">
                                <span className="project-title">
                                  {task.projectId ? task.projectId.title : 'No Project'}
                                </span>
                                <span className="assignee-avatar" title={task.assignedTo ? task.assignedTo.name : 'Unassigned'}>
                                  {getAssigneeInitial(task.assignedTo ? task.assignedTo.name : null)}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

export default Tasks;