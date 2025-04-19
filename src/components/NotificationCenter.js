import React, { useState, useEffect, useRef } from 'react';
import notificationService from '../services/NotificationService';
import { format } from 'date-fns';

/**
 * Notification Center Component - Displays a bell icon with notification count
 * and a dropdown with all notifications
 */
const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const notificationRef = useRef(null);

  // Load notifications and subscribe to changes
  useEffect(() => {
    // Load initial notifications
    setNotifications(notificationService.getNotifications());
    
    // Subscribe to notification changes
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });
    
    // Check notification permission on mount
    if (notificationService.permission !== 'granted' && 'Notification' in window) {
      setRequestingPermission(true);
    }
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Handle clicks outside of notification panel to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get unread notification count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Toggle notification panel
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  // Mark a notification as read
  const markAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.onClick) {
      notification.onClick();
    }
  };

  // Format notification time
  const formatNotificationTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    
    // If today, show time only
    if (notificationDate.toDateString() === now.toDateString()) {
      return format(notificationDate, 'h:mm a');
    }
    
    // If within the last week, show day of week
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (notificationDate > weekAgo) {
      return format(notificationDate, 'EEEE');
    }
    
    // Otherwise show date
    return format(notificationDate, 'MMM d, yyyy');
  };

  // Request notification permission
  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setRequestingPermission(!granted);
  };

  return (
    <div className="notification-center" ref={notificationRef}>
      {/* Bell icon with notification count */}
      <div className="notification-bell" onClick={toggleNotifications}>
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>
      
      {/* Notification permission request */}
      {requestingPermission && (
        <div className="notification-permission">
          <button onClick={requestPermission}>
            Enable Notifications
          </button>
        </div>
      )}
      
      {/* Notification dropdown panel */}
      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button onClick={markAllAsRead} className="mark-all-read">
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {formatNotificationTime(notification.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter; 