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
        headers: {
          'x-auth-token': token,
          'Accept': 'application/json', // Explicitly ask for JSON
        },
      });

      // **ULTIMATE DIAGNOSTIC STEP:**
      // Read the response as text first to see what we're actually getting.
      const responseText = await response.text();

      if (!response.ok) {
        // If the server sent an error status (4xx, 5xx), the text might be the error message.
        throw new Error(`Server responded with status ${response.status}: ${responseText}`);
      }

      // Now, try to parse the text as JSON.
      try {
        const data = JSON.parse(responseText);
        setStats(data);
      } catch (e) {
        // If parsing fails, it means the response was not JSON.
        // We can now show the user exactly what was received.
        throw new Error(`The server sent an invalid response that was not JSON. Response received: ${responseText.substring(0, 100)}...`);
      }

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError(err.message);
      localStorage.removeItem('token'); // It's safest to log out on any dashboard error.
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
    return (
      <div className="error-container">
        <h2>Failed to Load Dashboard</h2>
        {/* This will now display a much more useful error message */}
        <p style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{error}</p>
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