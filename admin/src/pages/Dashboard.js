import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // Assuming you have these CSS files from previous steps
import './Shared.css';

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
    const headers = { 'x-auth-token': token, 'Content-Type': 'application/json' };

    try {
        // We will fetch all required data in parallel
        const [statsRes, userRes, tasksRes, projectsRes] = await Promise.all([
            fetch('/api/dashboard/stats', { headers }),
            fetch('/api/auth/user', { headers }),
            fetch('/api/tasks', { headers }),
            fetch('/api/projects?limit=5', { headers }) // Assuming you want recent projects
        ]);

        // **CRITICAL FIX:** Check if the response is OK before trying to parse JSON
        if (!statsRes.ok || !userRes.ok || !tasksRes.ok || !projectsRes.ok) {
            // If any response is not okay, we throw an error to be caught by the catch block
            throw new Error('Failed to load dashboard data. Please log in again.');
        }

        // Now that we know the responses are okay, we can safely parse them
        const statsData = await statsRes.json();
        const userData = await userRes.json();
        const tasksData = await tasksRes.json();
        const projectsData = await projectsRes.json();

        // Update state with the fetched data
        setStats(statsData);
        setCurrentUser(userData);
        setMyTasks(tasksData.slice(0, 5));
        setRecentProjects(projectsData.slice(0, 5)); // Assuming the API returns projects sorted by recency

    } catch (err) {
        // This block will now catch network errors AND bad responses (like 401, 403, 404)
        console.error("Dashboard fetch error:", err.message);
        setError(err.message || 'An unknown error occurred.');
        // If there's an auth error, it's good practice to clear the bad token and redirect
        if (err.message.includes('Failed to load')) {
            localStorage.removeItem('token');
            navigate('/login');
        }
    } finally {
        setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return <div className="loading-container">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Welcome, {currentUser?.name || 'User'}!</h1>
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
        {/* You can add back the recent projects and tasks tables here */}
    </div>
  );
}

export default Dashboard;