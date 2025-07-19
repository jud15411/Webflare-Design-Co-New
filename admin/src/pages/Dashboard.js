import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// The API URL is now dynamically set from your .env file
const API_URL = process.env.REACT_APP_API_URL;

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

      // **THE FIX:** The fetch URL now uses the absolute path to your deployed backend.
      const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: {
          'x-auth-token': token,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text(); // Get raw text to avoid JSON parse error
        throw new Error(`Server responded with status ${response.status}: ${errorText.substring(0, 150)}...`);
      }

      const data = await response.json();
      setStats(data);

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      // Display the full error message for better debugging
      setError(err.message);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Restart your React server after creating the .env file!
  if (isLoading) {
    return <div className="loading-container">Loading Dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Failed to Load Dashboard</h2>
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