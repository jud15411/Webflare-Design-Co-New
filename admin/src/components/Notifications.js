import React, { useState, useEffect, useCallback } from 'react';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const token = localStorage.getItem('token');

  // fetchNotifications function remains the same
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
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // This is the updated logic
  const handleIconClick = async () => {
    // When we are opening the panel for the first time with notifications
    if (!isOpen && notifications.length > 0) {
      try {
        // Mark them as read on the backend
        await fetch(`${process.env.REACT_APP_API_URL}/api/notifications/mark-read`, {
          method: 'PUT',
          headers: { 'x-auth-token': token }
        });
        // We will let the next poll clear the number, but keep them visible for now.
      } catch (error) {
        console.error("Could not mark notifications as read:", error);
      }
    }
    // Simply toggle the panel's visibility
    setIsOpen(!isOpen);
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