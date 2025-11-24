import React from 'react';

const RoomSelector = ({ currentRoom, availableRooms, onRoomChange }) => {
  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '1rem',
      border: '1px solid #e9ecef',
      marginBottom: '1rem'
    }}>
      <h3 style={{ 
        margin: '0 0 1rem 0', 
        color: '#495057',
        fontSize: '1rem'
      }}>
        Chat Rooms
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {availableRooms.map(room => (
          <button
            key={room}
            onClick={() => onRoomChange(room)}
            style={{
              padding: '0.75rem',
              backgroundColor: currentRoom === room ? '#3498db' : 'white',
              color: currentRoom === room ? 'white' : '#495057',
              border: '1px solid #dee2e6',
              borderRadius: '5px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: currentRoom === room ? 'bold' : 'normal'
            }}
          >
            # {room}
            {currentRoom === room && ' ✓'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomSelector;