import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:5000';

// Simple socket instance - no complex class
export const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});