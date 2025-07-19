import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalRevenue: 0,
        pendingTasks: 0,
        hoursToday: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/dashboard/stats', {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                // Set the state with the data received from the backend
                setStats({
                    totalProjects: res.data.totalProjects || 0,
                    totalRevenue: res.data.totalRevenue || 0,
                    pendingTasks: res.data.pendingTasks || 0,
                    hoursToday: res.data.hoursToday || 0,
                });
            } catch (err) {
                setError('Failed to fetch dashboard stats.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            <div className="stats-grid">
                <div className="stat-card">
                    <h2>Total Projects</h2>
                    <p>{stats.totalProjects}</p>
                </div>
                <div className="stat-card">
                    <h2>Total Revenue</h2>
                    <p>${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <h2>Your Pending Tasks</h2>
                    <p>{stats.pendingTasks}</p>
                </div>
                <div className="stat-card">
                    <h2>Hours Logged Today</h2>
                    <p>{stats.hoursToday}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;