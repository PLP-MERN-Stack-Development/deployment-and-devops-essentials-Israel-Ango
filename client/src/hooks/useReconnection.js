import { useState, useEffect, useCallback } from 'react';
import { socket } from '../socket';

export const useReconnection = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [lastDisconnect, setLastDisconnect] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const checkConnectionQuality = useCallback(() => {
    const startTime = Date.now();
    socket.emit('ping', { timestamp: startTime });
    
    // Fixed: Remove the parameter from the event handler
    const handlePong = () => {
      const latency = Date.now() - startTime;
      
      let quality = 'good';
      if (latency > 1000) quality = 'poor';
      else if (latency > 500) quality = 'fair';
      
      setConnectionQuality(quality);
    };

    socket.once('pong', handlePong);
  }, []);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      console.log('Connection established');
    };

    const handleDisconnect = (reason) => {
      setIsConnected(false);
      setLastDisconnect(new Date());
      console.log('Disconnected:', reason);
    };

    const handleReconnectAttempt = (attempt) => {
      setReconnectAttempts(attempt);
      console.log(`Reconnection attempt ${attempt}`);
    };

    const handleReconnect = (attempt) => {
      setIsConnected(true);
      setReconnectAttempts(0);
      console.log('Reconnected after', attempt, 'attempts');
    };

    const handleReconnectFailed = () => {
      console.log('Failed to reconnect after maximum attempts');
    };

    // Set up event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_failed', handleReconnectFailed);

    // Check connection quality periodically
    const qualityInterval = setInterval(checkConnectionQuality, 30000);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_failed', handleReconnectFailed);
      clearInterval(qualityInterval);
    };
  }, [checkConnectionQuality]);

  const manualReconnect = useCallback(() => {
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  const getConnectionStatus = useCallback(() => {
    if (!isConnected) {
      return {
        status: 'disconnected',
        message: 'Disconnected from server',
        color: '#f44336'
      };
    }

    switch (connectionQuality) {
      case 'poor':
        return {
          status: 'poor',
          message: 'Poor connection',
          color: '#ff9800'
        };
      case 'fair':
        return {
          status: 'fair', 
          message: 'Fair connection',
          color: '#ffc107'
        };
      default:
        return {
          status: 'good',
          message: 'Good connection',
          color: '#4caf50'
        };
    }
  }, [isConnected, connectionQuality]);

  return {
    isConnected,
    connectionQuality,
    lastDisconnect,
    reconnectAttempts,
    manualReconnect,
    getConnectionStatus,
    checkConnectionQuality
  };
};