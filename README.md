💬 Real-Time Chat Application A full-featured, real-time chat application built with React, Node.js, Socket.io, and MongoDB. Experience seamless communication with advanced features like private messaging, typing indicators, message reactions, and real-time notifications.

https://img.shields.io/badge/Status-Production%2520Ready-brightgreen https://img.shields.io/badge/React-18.2.0-blue https://img.shields.io/badge/Socket.io-4.7.5-orange https://img.shields.io/badge/MongoDB-7.0-green

✨ Features 🚀 Core Features Real-time Messaging - Instant message delivery between users

Multiple Chat Rooms - General, Random, Tech, and Gaming rooms

User Authentication - Simple username-based login system

Online User Presence - See who's online in real-time

Responsive Design - Works perfectly on desktop, tablet, and mobile

🔥 Advanced Features Private Messaging - Direct user-to-user conversations

Typing Indicators - See when others are typing

Message Reactions - Express with 👍, ❤️, 😂, 😮 reactions

Real-time Notifications - Visual, sound, and browser notifications

Message Search - Search through conversation history

Message Pagination - Load older messages on demand

Read Receipts - See when messages are delivered and read

Connection Management - Automatic reconnection with quality monitoring

🗄️ Database Features MongoDB Integration - Persistent message history

Message Persistence - Chat history survives server restarts

Data Analytics Ready - Structured data for analysis in MongoDB Compass

🛠️ Tech Stack Frontend React 18 - Modern UI framework

Vite - Fast development build tool

Socket.io Client - Real-time communication

CSS-in-JS - Responsive styling

Backend Node.js - Runtime environment

Express.js - Web framework

Socket.io - Real-time WebSocket communication

MongoDB - Database for message storage

Mongoose - MongoDB object modeling

📦 Installation Prerequisites Node.js 18+

MongoDB (local or Atlas connection)

npm or yarn

Clone the Repository bash git clone cd realtime-chat Server Setup bash cd server Install dependencies npm install

Set up environment variables echo "MONGODB_URI=mongodb://localhost:27017/realtime-chat" > .env echo "PORT=5000" >> .env

Start development server npm run dev 3. Client Setup bash cd client

Install dependencies npm install

Start development server npm run dev 4. MongoDB Setup bash

Option A: Local MongoDB mongod

Option B: MongoDB Atlas Update MONGODB_URI in server/.env with your Atlas connection string 🚀 Running the Application Development Mode Start MongoDB (if using locally)

Start Backend Server

bash cd server npm run dev Start Frontend Client

bash cd client npm run dev Access Application

Frontend: http://localhost:5173

Backend API: http://localhost:5000

Production Build bash

Build client cd client npm run build

Start production server cd ../server npm start 📁 Project Structure text realtime-chat/ ├── server/ # Backend Node.js server │ ├── index.js # Main server file with Socket.io │ ├── .env # Environment variables │ ├── package.json │ └── config/ │ └── database.js # MongoDB connection ├── client/ # Frontend React application │ ├── src/ │ │ ├── App.jsx # Main application component │ │ ├── socket.js # Socket.io client configuration │ │ ├── main.jsx # React entry point │ │ └── components/ # React components │ │ ├── ChatRoom.jsx │ │ ├── OnlineUsers.jsx │ │ ├── RoomSelector.jsx │ │ ├── NotificationBell.jsx │ │ └── MessageSearch.jsx │ ├── package.json │ └── vite.config.js └── README.md 🎮 How to Use Getting Started Join Chat: Enter a unique username on the login screen

Choose Room: Select from available chat rooms (General, Random, Tech, Gaming)

Start Chatting: Send messages and see them appear in real-time

Advanced Features Private Messages: Click "Message" button on any online user

Message Reactions: Click reaction buttons below messages

Search Messages: Use the search bar to find past conversations

Notifications: Click the bell icon to view all notifications

Room Switching: Change rooms using the room selector sidebar

Keyboard Shortcuts Enter - Send message

Shift + Enter - New line in message

Esc - Close modals and dropdowns

🔧 Configuration Environment Variables Create a .env file in the server directory:

env MONGODB_URI=mongodb://localhost:27017/realtime-chat PORT=5000 NODE_ENV=development MongoDB Connection The application supports:

Local MongoDB: mongodb://localhost:27017/realtime-chat

MongoDB Atlas: Your Atlas connection string

Database Name: realtime-chat

Collections: messages, users, rooms

🐛 Troubleshooting Common Issues Port Already in Use

bash

Change port in server/.env PORT=5001 MongoDB Connection Failed

bash

Ensure MongoDB is running mongod

Or update connection string in .env Socket Connection Errors

Check if server is running on port 5000

Verify CORS settings in server configuration

Check browser console for connection errors

Build Errors

bash

Clear dependencies and reinstall rm -rf node_modules rm package-lock.json npm install 📈 Performance Features Message Pagination: Loads messages in chunks for better performance

Connection Monitoring: Real-time connection quality assessment

Efficient Reconnection: Smart reconnection logic with exponential backoff

Optimized Rendering: React memoization and efficient state updates

Database Indexing: Optimized MongoDB queries with proper indexing

🔒 Security Considerations Input validation and sanitization

XSS protection through React's built-in escaping

CORS configuration for controlled access

Rate limiting considerations for message sending

No sensitive data storage in client-side

🚀 Deployment Backend Deployment (Heroku/ Railway) bash

Set environment variables MONGODB_URI=your_production_mongodb_uri PORT=your_port NODE_ENV=production Frontend Deployment (Vercel/ Netlify) Build command: npm run build

Output directory: dist

Environment: Production

🤝 Contributing Fork the repository

Create a feature branch: git checkout -b feature/amazing-feature

Commit changes: git commit -m 'Add amazing feature'

Push to branch: git push origin feature/amazing-feature

Open a Pull Request

📄 License This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments Socket.io for real-time communication capabilities

MongoDB for robust data persistence

React team for the excellent frontend framework

Vite for fast development experience

📞 Support If you encounter any issues or have questions:

Check the Troubleshooting section

Open an issue on GitHub

Check browser console for error details

Render deplyed : https://development-server-jpmv.onrender.com

Built with ❤️ using modern web technologies

Happy Chatting! 💬