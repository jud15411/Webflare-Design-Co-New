import React, { useState, useEffect, useCallback } from 'react';
import './Shared.css';

function Reports() {
  const [timeReport, setTimeReport] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem('token');

  const fetchReport = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reports/time-by-project`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      setTimeReport(data);
    } catch (err) {
      console.error("Failed to fetch time report:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (isLoading) return <div>Loading report...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Time Report by Project</h1>
      </div>
      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Project Title</th>
              <th>Total Hours Logged</th>
            </tr>
          </thead>
          <tbody>
            {timeReport.map(report => (
              <tr key={report.projectId}>
                <td>{report.projectTitle}</td>
                <td>{report.totalHours.toFixed(2)} hours</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Reports;