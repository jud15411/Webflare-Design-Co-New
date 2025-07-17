import React, { useState, useEffect, useCallback } from 'react';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const token = localStorage.getItem('token');

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [token]);

  useEffect(() => {
    // Fetch notifications on initial load
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval); // Cleanup on component unmount
  }, [fetchNotifications]);

  const handleIconClick = async () => {
    setIsOpen(!isOpen);
    // If opening the panel and there are unread notifications, mark them as read
    if (!isOpen && notifications.length > 0) {
      await fetch(`${process.env.REACT_APP_API_URL}/api/notifications/mark-read`, {
        method: 'PUT',
        headers: { 'x-auth-token': token }
      });
      // Set notifications to empty immediately for a faster UI update
      setNotifications([]);
    }
  };

  return (
    <div className="notification-bell">
      <button onClick={handleIconClick} className="bell-button">
        🔔
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
      </button>
      {isOpen && (
        <div className="notification-panel">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <div key={notif._id} className="notification-item">
                {notif.message}
              </div>
            ))
          ) : (
            <div className="notification-item empty">No new notifications</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;