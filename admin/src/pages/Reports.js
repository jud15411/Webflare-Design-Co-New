import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css'; // Assuming this has general table styling

function Reports() {
  const [timeByProjectReport, setTimeByProjectReport] = useState([]);
  const [timeByUserProjectReport, setTimeByUserProjectReport] = useState([]); // New state for user-project report
  const [taskStatusSummary, setTaskStatusSummary] = useState([]); // New state for task status report
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem('token');

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Time Report by Project
      const projectTimeResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/reports/time-by-project`, {
        headers: { 'x-auth-token': token }
      });
      const projectTimeData = await projectTimeResponse.json();
      setTimeByProjectReport(projectTimeData);

      // Fetch Time Report by User and Project
      const userProjectTimeResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/reports/time-by-user-project`, {
        headers: { 'x-auth-token': token }
      });
      const userProjectTimeData = await userProjectTimeResponse.json();
      setTimeByUserProjectReport(userProjectTimeData);

      // Fetch Task Status Summary
      const taskStatusResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/reports/task-status-summary`, {
        headers: { 'x-auth-token': token }
      });
      const taskStatusData = await taskStatusResponse.json();
      setTaskStatusSummary(taskStatusData);

    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (isLoading) return <div className="loading-message">Loading reports...</div>;

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1 className="page-title">Comprehensive Reports</h1>
      </div>

      {/* Time Report by Project */}
      <div className="report-section">
        <h3>Time Logged by Project</h3>
        {timeByProjectReport.length > 0 ? (
          <div className="data-table-container">
            <table>
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Total Hours Logged</th>
                </tr>
              </thead>
              <tbody>
                {timeByProjectReport.map(report => (
                  <tr key={report.projectId}>
                    <td>{report.projectTitle}</td>
                    <td>{report.totalHours.toFixed(2)} hours</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No time logged for projects yet.</p>
        )}
      </div>

      {/* Time Report by User and Project */}
      <div className="report-section">
        <h3>Time Logged by User & Project</h3>
        {timeByUserProjectReport.length > 0 ? (
          <div className="data-table-container">
            <table>
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Project Title</th>
                  <th>Total Hours Logged</th>
                </tr>
              </thead>
              <tbody>
                {timeByUserProjectReport.map((report, index) => (
                  <tr key={`${report.userId}-${report.projectId || index}`}> {/* Fallback key if projectId is null */}
                    <td>{report.userName}</td>
                    <td>{report.projectTitle}</td>
                    <td>{report.totalHours.toFixed(2)} hours</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No time logged by users for projects yet.</p>
        )}
      </div>

      {/* Task Status Summary */}
      <div className="report-section">
        <h3>Task Status Summary</h3>
        {taskStatusSummary.length > 0 ? (
          <div className="data-table-container">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Number of Tasks</th>
                </tr>
              </thead>
              <tbody>
                {taskStatusSummary.map(report => (
                  <tr key={report.status}>
                    <td>{report.status}</td>
                    <td>{report.count} tasks</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No tasks found.</p>
        )}
      </div>
    </div>
  );
}

export default Reports;