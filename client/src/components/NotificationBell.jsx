import React, { useState, useRef, useEffect } from 'react';

const NotificationBell = ({ unreadCount, onBellClick, notifications }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen && unreadCount > 0) {
      onBellClick();
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return time.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'private_message':
        return '💬';
      case 'mention':
        return '📍';
      case 'room_join':
        return '🚪';
      case 'user_joined':
        return '👋';
      case 'user_left':
        return '👋';
      default:
        return '🔔';
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        style={{
          position: 'relative',
          backgroundColor: 'transparent',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '50%',
          color: unreadCount > 0 ? '#3498db' : '#666'
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            backgroundColor: '#e74c3c',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '350px',
          maxHeight: '400px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>
              Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => onBellClick()}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#3498db',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#666'
              }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: notification.read ? 'transparent' : '#f8f9fa',
                    cursor: 'pointer'
                  }}
                  onClick={() => !notification.read && onBellClick(notification.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: notification.read ? 'normal' : 'bold',
                        color: notification.read ? '#666' : '#333',
                        marginBottom: '0.25rem'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#999'
                      }}>
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                    {!notification.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#3498db',
                        borderRadius: '50%',
                        flexShrink: 0,
                        marginTop: '0.25rem'
                      }}></div>
                    )}
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

export default NotificationBell;