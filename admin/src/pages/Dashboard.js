import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Shared.css'; // A shared CSS file for common styles like status badges

const API_URL = process.env.REACT_APP_API_URL;

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // We now make two separate, clear API calls
      const [dashboardRes, userRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/stats`, { headers: { 'x-auth-token': token } }),
        fetch(`${API_URL}/api/auth/user`, { headers: { 'x-auth-token': token } })
      ]);

      if (!dashboardRes.ok || !userRes.ok) {
        throw new Error('Failed to load dashboard data. Your session may have expired.');
      }

      const dashboardData = await dashboardRes.json();
      const userData = await userRes.json();
      
      setStats(dashboardData.stats);
      setRecentProjects(dashboardData.recentProjects || []);
      setMyTasks(dashboardData.myTasks || []);
      setCurrentUser(userData);

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError(err.message);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusClass = (status) => {
    return status ? status.toLowerCase().replace(/\s+/g, '-') : '';
  };

  if (isLoading) {
    return <div className="loading-container">Loading Dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Failed to Load Dashboard</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/login')} className="login-button">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Welcome, {currentUser?.name}!</h1>
          <p className="current-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="stats-cards">
        <div className="card">
          <h3>Total Projects</h3>
          <p>{stats?.totalProjects ?? '0'}</p>
        </div>
        <div className="card">
          <h3>Total Revenue</h3>
          <p>${(stats?.totalRevenue ?? 0).toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Your Pending Tasks</h3>
          <p>{stats?.pendingTasks ?? '0'}</p>
        </div>
        <div className="card">
          <h3>Hours Logged Today</h3>
          <p>{stats?.hoursToday ?? '0'}</p>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="table-container">
          <h2 className="table-title">Recent Projects</h2>
          <table className="dashboard-table">
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
                  <tr key={project._id} onClick={() => navigate(`/projects/${project._id}`)} className="clickable-row">
                    <td>{project.title}</td>
                    <td>{project.clientId?.name || 'N/A'}</td>
                    <td>
                      <span className={`status ${getStatusClass(project.status)}`}>{project.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="empty-table-cell">No recent projects to display.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="tasks-container">
            <h2 className="table-title">My 5 Most Recent Tasks</h2>
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