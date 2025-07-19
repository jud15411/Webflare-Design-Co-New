import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
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

      const response = await fetch('/api/dashboard/stats', {
        headers: { 'x-auth-token': token }
      });

      // **CRITICAL FIX:** First, check if the HTTP response itself is okay.
      if (!response.ok) {
        // If the response is not okay (e.g., status 401, 500),
        // we try to read the JSON error body we created on the backend.
        const errorData = await response.json();
        // We then throw an error with the specific message from the server.
        throw new Error(errorData.msg || `Server responded with status: ${response.status}`);
      }

      // Only if the response is okay do we parse the successful JSON data.
      const data = await response.json();
      setStats(data);

    } catch (err) {
      // This catch block now handles all errors cleanly.
      console.error("Dashboard Fetch Error:", err);
      setError(err.message);
      // If an auth error or server error occurs, it's safest to log the user out.
      localStorage.removeItem('token');
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
    // The UI now displays a helpful error message and a clear next step.
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
      <h1>Admin Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h2>Total Projects</h2>
          <p>{stats?.totalProjects ?? '0'}</p>
        </div>
        <div className="stat-card">
          <h2>Total Revenue</h2>
          <p>${(stats?.totalRevenue ?? 0).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h2>Your Pending Tasks</h2>
          <p>{stats?.pendingTasks ?? '0'}</p>
        </div>
        <div className="stat-card">
          <h2>Hours Logged Today</h2>
          <p>{stats?.hoursToday ?? '0'}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;