import React, { useState } from 'react';

const OnlineUsers = ({ onlineUsers, currentUser, onPrivateMessage }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateMessage, setPrivateMessage] = useState('');

  const handlePrivateMessage = () => {
    if (privateMessage.trim() && selectedUser) {
      onPrivateMessage(selectedUser.username, privateMessage.trim());
      setPrivateMessage('');
      setSelectedUser(null);
    }
  };

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '1rem',
      border: '1px solid #e9ecef'
    }}>
      <h3 style={{ 
        margin: '0 0 1rem 0', 
        color: '#495057',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          backgroundColor: '#28a745',
          borderRadius: '50%'
        }}></span>
        Online Users ({onlineUsers.length})
      </h3>
      
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {onlineUsers.map(user => (
          <div
            key={user.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem',
              marginBottom: '0.25rem',
              backgroundColor: user.id === currentUser?.id ? '#e3f2fd' : 'transparent',
              borderRadius: '4px',
              border: user.id === currentUser?.id ? '1px solid #bbdefb' : 'none'
            }}
          >
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              backgroundColor: '#28a745',
              borderRadius: '50%',
              marginRight: '0.5rem'
            }}></span>
            <div style={{ flex: 1 }}>
              <span style={{
                color: user.id === currentUser?.id ? '#1976d2' : '#495057',
                fontWeight: user.id === currentUser?.id ? 'bold' : 'normal'
              }}>
                {user.username}
                {user.id === currentUser?.id && ' (You)'}
              </span>
              <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                in #{user.currentRoom || 'general'}
              </div>
            </div>
            
            {user.id !== currentUser?.id && (
              <button
                onClick={() => setSelectedUser(user)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Message
              </button>
            )}
          </div>
        ))}
        
        {onlineUsers.length === 0 && (
          <div style={{ 
            color: '#6c757d', 
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '1rem'
          }}>
            No users online
          </div>
        )}
      </div>

      {/* Private Message Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>
              Message to {selectedUser.username}
            </h3>
            <textarea
              value={privateMessage}
              onChange={(e) => setPrivateMessage(e.target.value)}
              placeholder="Type your private message..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '1rem',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={handlePrivateMessage}
                disabled={!privateMessage.trim()}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: privateMessage.trim() ? '#3498db' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: privateMessage.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Send
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;