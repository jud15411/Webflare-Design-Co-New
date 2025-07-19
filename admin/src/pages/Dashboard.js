import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Shared.css';

function Dashboard() {
  const [stats, setStats] = useState({ totalProjects: 0, totalRevenue: 0, pendingTasks: 0, hoursToday: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const headers = { 'x-auth-token': token };

      // Use relative paths for API calls, consistent with other components
      const [statsRes, userRes, tasksRes, projectsRes] = await Promise.all([
        fetch('/api/dashboard/stats', { headers }),
        fetch('/api/auth/user', { headers }),
        fetch('/api/tasks', { headers }),
        fetch('/api/projects', { headers }) // Fetching recent projects
      ]);

      if (!statsRes.ok || !userRes.ok || !tasksRes.ok || !projectsRes.ok) {
        // Log the specific error to the console for easier debugging
        console.error('Failed to fetch dashboard data:', { 
            stats: statsRes.statusText, 
            user: userRes.statusText, 
            tasks: tasksRes.statusText,
            projects: projectsRes.statusText
        });
        throw new Error('Could not load dashboard information. Please try again later.');
      }

      const statsData = await statsRes.json();
      const userData = await userRes.json();
      const tasksData = await tasksRes.json();
      const projectsData = await projectsRes.json();
      
      setStats(statsData);
      setCurrentUser(userData);
      // Assuming tasksData is an array of tasks for the user
      setMyTasks(tasksData.slice(0, 5)); 
      // Assuming projectsData is an array of all projects
      setRecentProjects(projectsData.slice(0, 5));

    } catch (err) {
      setError(err.message);
      console.error(err);
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
    return <div className="error-container">{error}</div>;
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
                <p>{stats.totalProjects ?? '0'}</p>
            </div>
            <div className="card">
                <h3>Total Revenue</h3>
                <p>${(stats.totalRevenue ?? 0).toLocaleString()}</p>
            </div>
            <div className="card">
                <h3>Your Pending Tasks</h3>
                <p>{stats.pendingTasks ?? '0'}</p>
            </div>
            <div className="card">
                <h3>Hours Logged Today</h3>
                <p>{stats.hoursToday ?? '0'}</p>
            </div>
        </div>
        
        {/* Rest of your JSX for recent projects and tasks */}
    </div>
  );
}

export default Dashboard;