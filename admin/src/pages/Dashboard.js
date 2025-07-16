import React, { useState, useEffect } from 'react';
import './Dashboard.css'; // Your existing dashboard CSS
import './Shared.css'; // Our shared styles for tables

function Dashboard() {
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingTasks: 0,
    invoicesDue: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/dashboard/stats`, {
          headers: { 'x-auth-token': token }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const data = await response.json();
        setStats({
          activeProjects: data.activeProjects,
          pendingTasks: data.pendingTasks,
          invoicesDue: data.invoicesDue,
        });
        setRecentProjects(data.recentProjects);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <div>Loading Dashboard...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
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
          <p className="stat-number">--</p> {/* Placeholder for more complex stats */}
        </div>
      </div>

      <div className="data-table-container">
        <h2 className="table-title">Recent Project Updates</h2>
        <table>
          <thead>
            <tr>
              <th>Project Title</th>
              <th>Client</th>
              <th>Status</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {recentProjects.length > 0 ? (
              recentProjects.map(project => (
                <tr key={project._id}>
                  <td>{project.title}</td>
                  <td>{project.clientId?.name || 'N/A'}</td>
                  <td>
                    {/* You can add a class to the span for styling based on status */}
                    <span className="status">{project.status}</span>
                  </td>
                  <td>{project.description}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No recent projects to display.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;