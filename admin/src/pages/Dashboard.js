import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // Assuming you have this CSS from a previous step

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

      // **CRITICAL FIX:** Check if the response was successful (status 200-299).
      // If not, we can parse the JSON error message from our backend.
      if (!response.ok) {
        // Try to get the error message from the backend, or use a default.
        const errorData = await response.json();
        throw new Error(errorData.msg || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);

    } catch (err) {
      // This will now catch both network errors and the specific errors we throw.
      console.error("Dashboard Fetch Error:", err.message);
      setError(err.message);
      // It's good practice to clear a potentially bad token if something goes wrong
      if (err.message.includes('HTTP error')) {
        localStorage.removeItem('token');
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

  // This will now display a much more helpful error message on the UI.
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