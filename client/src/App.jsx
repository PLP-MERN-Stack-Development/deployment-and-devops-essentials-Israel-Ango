import React, { useState, useEffect, useRef } from 'react';
import { socket } from './socket';
import RoomSelector from './components/RoomSelector';
import OnlineUsers from './components/OnlineUsers';
import NotificationBell from './components/NotificationBell';

function App() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [availableRooms, setAvailableRooms] = useState(['general']);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [activeView, setActiveView] = useState('room');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Basic socket connection state
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('welcome', (data) => {
      setOnlineUsers(data.onlineUsers || []);
      setAvailableRooms(data.availableRooms || ['general']);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        text: data.message,
        timestamp: new Date().toISOString()
      }]);
    });

    socket.on('user-joined', (data) => {
      setOnlineUsers(data.onlineUsers || []);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        text: data.message,
        timestamp: new Date().toISOString()
      }]);
    });

    socket.on('user-left', (data) => {
      setOnlineUsers(data.onlineUsers || []);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        text: data.message,
        timestamp: new Date().toISOString()
      }]);
    });

    socket.on('user-joined-room', (data) => {
      if (data.room === currentRoom) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'system',
          text: data.message,
          timestamp: new Date().toISOString()
        }]);
      }
    });

    socket.on('room-joined', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        text: data.message,
        timestamp: new Date().toISOString()
      }]);
    });

    socket.on('new-message', (message) => {
      if (message.room === currentRoom) {
        setMessages(prev => [...prev, message]);
        
        // Check for mentions
        if (message.text && message.username !== username && message.text.includes(`@${username}`)) {
          addNotification({
            type: 'mention',
            from: message.username,
            message: `${message.username} mentioned you in #${currentRoom}`,
            room: currentRoom
          });
        }
      }
    });

    socket.on('new-private-message', (message) => {
      setPrivateMessages(prev => [...prev, message]);
      
      // Notify for private messages
      if (!message.isOwnMessage && activeView !== 'private') {
        addNotification({
          type: 'private_message',
          from: message.fromUsername,
          message: `New private message from ${message.fromUsername}`
        });
      }
    });

    socket.on('user-typing', (data) => {
      if (data.room === currentRoom) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.username);
          } else {
            newSet.delete(data.username);
          }
          return newSet;
        });
      }
    });

    socket.on('online-users-list', (users) => {
      setOnlineUsers(users || []);
    });

    socket.on('message-reaction', (reactionData) => {
      if (reactionData.room === currentRoom) {
        setMessages(prev => prev.map(msg => 
          msg.id === reactionData.messageId 
            ? { ...msg, reactions: { ...msg.reactions, [reactionData.username]: reactionData.reaction } }
            : msg
        ));
      }
    });

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('welcome');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('user-joined-room');
      socket.off('room-joined');
      socket.off('new-message');
      socket.off('new-private-message');
      socket.off('user-typing');
      socket.off('online-users-list');
      socket.off('message-reaction');
    };
  }, [currentRoom, activeView, username]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, privateMessages]);

  // Basic notification function
  const addNotification = (notificationData) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notificationData
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
    setUnreadCount(prev => prev + 1);

    // Play sound for important notifications (optional)
    if (notificationData.type === 'private_message' || notificationData.type === 'mention') {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {
        // Sound not available, continue silently
      }
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const handleTyping = () => {
    socket.emit('typing-start', { room: currentRoom });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', { room: currentRoom });
    }, 1000);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    
    if (activeView === 'room') {
      const payload = { text: input.trim() };
      socket.emit('send-message', payload);
    }
    
    setInput('');
    socket.emit('typing-stop', { room: currentRoom });
  };

  const handlePrivateMessage = (toUsername, text) => {
    socket.emit('send-private-message', { toUsername, text });
  };

  const handleRoomChange = (room) => {
    setCurrentRoom(room);
    socket.emit('join-room', { room });
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'system',
      text: `Switched to #${room}`,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleReaction = (messageId, reaction) => {
    socket.emit('react-to-message', { messageId, reaction });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReactionEmoji = (reaction) => {
    const emojis = {
      like: '👍',
      love: '❤️',
      laugh: '😂',
      wow: '😮',
      sad: '😢',
      angry: '😠'
    };
    return emojis[reaction] || '👍';
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoggedIn(true);
      socket.connect();
      socket.emit('user-join', { username: username.trim() });
    }
  };

  const handleLogout = () => {
    socket.disconnect();
    setIsLoggedIn(false);
    setMessages([]);
    setPrivateMessages([]);
    setUsername('');
    setCurrentRoom('general');
    setNotifications([]);
    setUnreadCount(0);
  };

  if (!isLoggedIn) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>
            Join Chat Room
          </h2>
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: '#555'
              }}>
                Choose a Username:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                minLength={2}
                maxLength={20}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!username.trim()}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: username.trim() ? '#3498db' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '1rem',
                cursor: username.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  const displayMessages = activeView === 'room' ? messages : privateMessages.filter(msg => 
    msg.type === 'private' && 
    (msg.fromUsername === username || msg.toUsername === username)
  );

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 300px',
      height: '100vh',
      padding: '1rem',
      gap: '1rem',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Main Chat Area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#3498db',
          color: 'white',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              {activeView === 'room' ? `# ${currentRoom}` : 'Private Messages'}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setActiveView('room')}
                style={{
                  backgroundColor: activeView === 'room' ? '#2980b9' : 'transparent',
                  border: '1px solid white',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Rooms
              </button>
              <button
                onClick={() => setActiveView('private')}
                style={{
                  backgroundColor: activeView === 'private' ? '#2980b9' : 'transparent',
                  border: '1px solid white',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Private
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NotificationBell 
              unreadCount={unreadCount}
              onBellClick={(notificationId) => {
                if (notificationId) {
                  markAsRead(notificationId);
                } else {
                  markAllAsRead();
                }
              }}
              notifications={notifications}
            />
            <span>Welcome, <strong>{username}</strong></span>
            <span style={{
              padding: '4px 8px',
              backgroundColor: isConnected ? '#4CAF50' : '#f44336',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {isConnected ? '🟢 Online' : '🔴 Offline'}
            </span>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid white',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Leave
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {displayMessages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: message.type === 'system' ? '#fff3e0' : 
                                message.type === 'private' ? '#e8f5e8' :
                                message.userId === socket.id ? '#e3f2fd' : '#f8f9fa',
                borderRadius: '8px',
                borderLeft: `4px solid ${
                  message.type === 'system' ? '#ff9800' :
                  message.type === 'private' ? '#4caf50' :
                  message.userId === socket.id ? '#2196f3' : '#3498db'
                }`
              }}
            >
              {message.type === 'system' ? (
                <div style={{ color: '#e65100', fontStyle: 'italic', textAlign: 'center' }}>
                  {message.text}
                </div>
              ) : message.type === 'private' ? (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem'
                  }}>
                    <strong style={{ color: '#2e7d32' }}>
                      {message.fromUsername === username ? `To ${message.toUsername}` : `From ${message.fromUsername}`}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                      {formatTime(message.timestamp)}
                      {message.read && ' ✓'}
                    </span>
                  </div>
                  <div>{message.text}</div>
                </div>
              ) : (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem'
                  }}>
                    <strong style={{ 
                      color: message.userId === socket.id ? '#1976d2' : '#2e7d32'
                    }}>
                      {message.username}
                      {message.userId === socket.id && ' (You)'}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div>{message.text}</div>
                  
                  {/* Message Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {Object.entries(message.reactions).map(([user, reaction]) => (
                        <span
                          key={user}
                          style={{
                            backgroundColor: '#e9ecef',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            border: '1px solid #dee2e6'
                          }}
                          title={`${user}: ${reaction}`}
                        >
                          {getReactionEmoji(reaction)}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Reaction Buttons */}
                  {message.type === 'user' && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                      {['like', 'love', 'laugh', 'wow'].map(reaction => (
                        <button
                          key={reaction}
                          onClick={() => handleReaction(message.id, reaction)}
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          {getReactionEmoji(reaction)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Typing Indicators */}
          {activeView === 'room' && typingUsers.size > 0 && (
            <div style={{
              color: '#666',
              fontStyle: 'italic',
              marginBottom: '1rem',
              padding: '0.5rem'
            }}>
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {activeView === 'room' && (
          <div style={{
            padding: '1rem',
            borderTop: '1px solid #eee',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder={`Message #${currentRoom}...`}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '1rem'
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: input.trim() ? '#3498db' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <RoomSelector 
          currentRoom={currentRoom}
          availableRooms={availableRooms}
          onRoomChange={handleRoomChange}
        />
        
        <OnlineUsers 
          onlineUsers={onlineUsers}
          currentUser={{ username, id: socket.id }}
          onPrivateMessage={handlePrivateMessage}
        />
      </div>
    </div>
  );
}

export default App;