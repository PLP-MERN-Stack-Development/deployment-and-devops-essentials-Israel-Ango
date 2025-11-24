import { useState, useRef, useEffect } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState('default');
  const audioRef = useRef(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.3;
  }, []);

  // Request browser notification permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Play sound notification
  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.log('Audio play failed:', error);
      });
    }
  };

  // Show browser notification
  const showBrowserNotification = (title, options = {}) => {
    if (permission !== 'granted') return;

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTimeout(() => notification.close(), 5000);
  };

  // Add new notification
  const addNotification = (notificationData) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notificationData
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
    setUnreadCount(prev => prev + 1);

    // Play sound for important notifications
    if (notificationData.type === 'private_message' || notificationData.type === 'mention') {
      playSound();
    }

    // Show browser notification
    if (document.hidden && permission === 'granted') {
      let title = 'New Notification';
      let body = notificationData.message;

      switch (notificationData.type) {
        case 'private_message':
          title = `Message from ${notificationData.from}`;
          body = notificationData.data?.text || 'New private message';
          break;
        case 'mention':
          title = `Mention from ${notificationData.from}`;
          body = `In #${notificationData.room}: ${notificationData.data?.text}`;
          break;
        case 'room_join':
          title = 'Room Joined';
          break;
        default:
          title = 'Chat Notification';
      }

      showBrowserNotification(title, { body });
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Remove notification
  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    setUnreadCount(prev => {
      const removedNotif = notifications.find(n => n.id === notificationId);
      return removedNotif && !removedNotif.read ? Math.max(0, prev - 1) : prev;
    });
  };

  return {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification
  };
};