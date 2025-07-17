import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Import for navigation
import './Dashboard.css';
import './Shared.css';

function Dashboard() {
  const [stats, setStats] = useState({ activeProjects: 0, pendingTasks: 0, invoicesDue: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); // Hook for navigation

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch all required data in parallel
      const [statsRes, userRes, tasksRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/dashboard/stats`, { headers: { 'x-auth-token': token } }),
        fetch(`${process.env.REACT_APP_API_URL}/api/auth/user`, { headers: { 'x-auth-token': token } }),
        fetch(`${process.env.REACT_APP_API_URL}/api/tasks`, { headers: { 'x-auth-token': token } })
      ]);

      if (!statsRes.ok || !userRes.ok || !tasksRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsRes.json();
      const userData = await userRes.json();
      const allTasks = await tasksRes.json();

      // Set stats and recent projects from the stats endpoint
      setStats({
        activeProjects: statsData.activeProjects,
        pendingTasks: statsData.pendingTasks,
        invoicesDue: statsData.invoicesDue,
      });
      setRecentProjects(statsData.recentProjects);
      
      // Set the current user
      setCurrentUser(userData);

      // Filter tasks to find open tasks assigned to the current user
      const userOpenTasks = allTasks.filter(task => 
        task.assignedTo?._id === userData._id && task.status !== 'Done'
      );
      setMyTasks(userOpenTasks);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Helper to get the correct CSS class for a status
  const getStatusClass = (status) => {
    return status?.toLowerCase().replace(/\s+/g, '-') || '';
  };

  if (isLoading) {
    return <div>Loading Dashboard...</div>;
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Welcome back, {currentUser?.name}! 👋</h1>
          <p className="current-date">
            Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="quick-actions">
          <button onClick={() => navigate('/projects')} className="action-button">+ New Project</button>
          <button onClick={() => navigate('/tasks')} className="action-button">+ New Task</button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="card">
          <h4>Active Projects</h4>
          <p className="stat-number">{stats.activeProjects}</p>
        </div>
        <div className="card">
          <h4>Pending Tasks</h4>
          <p className="stat-number">{stats.pendingTasks}</p>
        </div>
        <div className="card">
          <h4>Invoices Due</h4>
          <p className="stat-number">${stats.invoicesDue.toLocaleString()}</p>
        </div>
        <div className="card">
          <h4>Revenue (YTD)</h4>
          <p className="stat-number text-placeholder">--</p>
        </div>
      </div>

      <div className="dashboard-main-content">
        <div className="data-table-container">
          <h2 className="table-title">Recent Project Updates</h2>
          <table>
            <thead>
              <tr>
                <th>Project Title</th>
                <th>Client</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.length > 0 ? (
                recentProjects.map(project => (
                  <tr key={project._id}>
                    <td>{project.title}</td>
                    <td>{project.clientId?.name || 'N/A'}</td>
                    <td>
                      <span className={`status ${getStatusClass(project.status)}`}>{project.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No recent projects to display.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="my-tasks-container">
            <h2 className="table-title">My Open Tasks</h2>
            <div className="tasks-list">
                {myTasks.length > 0 ? (
                    myTasks.map(task => (
                        <div key={task._id} className="task-item">
                            <div className="task-info">
                                <p className="task-title">{task.title}</p>
                                <p className="task-project">{task.projectId?.title || 'No Project'}</p>
                            </div>
                            <span className={`status ${getStatusClass(task.status)}`}>{task.status}</span>
                        </div>
                    ))
                ) : (
                    <div className="empty-task-list">
                        <p>You have no open tasks. Great job! 🎉</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;