# 💬 ChatApp — Real-Time Messaging Platform

A production-quality WhatsApp Web–inspired chat application built with React, Node.js, Socket.IO, MongoDB, and JWT Authentication.

---

## ✨ Features

### Core
- 🔐 JWT Authentication (Register / Login / Logout)
- 💬 Real-time messaging via Socket.IO
- 🟢 Online/Offline presence tracking
- ⌨️ Typing indicators
- ✓✓ Read receipts & delivery status
- 🔔 Unread message counts

### Messages
- 📷 Image sharing
- 📎 File attachments
- 🎤 Voice messages (hold-to-record)
- ↩️ Reply to specific messages
- 😊 Emoji reactions (👍 ❤️ 😂 😮 😢 🙏)
- 📌 Pin messages
- 🗑️ Delete for everyone / delete for me
- 🔍 Message search

### Groups
- 👥 Group chats with admin controls
- ➕ Add / remove members
- ✏️ Edit group name & avatar

### Profile
- 🖼️ Profile picture upload
- ✏️ Edit username & bio
- 🚫 Block / unblock users

### UI/UX
- 🌑 Dark mode only (modern dark theme)
- 📱 Fully responsive (mobile-friendly)
- ⚡ Smooth animations
- 🎨 WhatsApp/Discord-inspired design

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Tailwind CSS |
| State | Context API |
| Real-time | Socket.IO Client |
| HTTP | Axios |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO |
| Auth | JWT + Bcrypt |
| Database | MongoDB + Mongoose |
| File Upload | Multer |
| Security | Helmet, express-rate-limit |
| DevOps | Docker, Docker Compose |
| Testing | Jest, Supertest |

---

## 📁 Project Structure

```
chatapp/
├── backend/
│   ├── __tests__/        # Unit & integration tests
│   ├── config/           # Database connection
│   ├── controllers/      # Route handlers
│   ├── middleware/        # JWT auth middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── socket/           # Socket.IO event handlers
│   ├── uploads/          # Uploaded files (gitignored)
│   ├── server.js         # Entry point
│   └── .env.example
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── auth/     # ProtectedRoute
│       │   ├── chat/     # Sidebar, ChatWindow, MessageBubble, Modals
│       │   └── ui/       # Avatar, shared UI
│       ├── context/      # AuthContext, ChatContext
│       ├── pages/        # AuthPage, ChatPage
│       └── services/     # API client, Socket service
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & setup environment

```bash
git clone <your-repo>
cd chatapp

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Frontend
cp frontend/.env.example frontend/.env
```

### 2. Backend

```bash
cd backend
npm install
npm run dev

# Runs on http://localhost:5000
# runs live on https://chatapp-sim5.onrender.com



```

### 3. Frontend

```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

---

## 🐳 Docker

```bash
# Build and run everything
docker-compose up --build

# Stop
docker-compose down

# With volumes removed
docker-compose down -v
```

Services:
- Frontend: https://chatapp-akbarnuman.vercel.app
- Backend: https://chatapp-sim5.onrender.com
- MongoDB: localhost:27017

---

## 🧪 Tests

```bash
cd backend
npm test               # Run all tests
npm test -- --coverage # With coverage report
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/logout` | ✅ | Logout |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | ✅ | List/search users |
| GET | `/api/users/:id` | ✅ | Get user by ID |
| PUT | `/api/users/:id` | ✅ | Update profile |
| POST | `/api/users/:id/block` | ✅ | Block/unblock user |

### Conversations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/conversations` | ✅ | Get all conversations |
| POST | `/api/conversations` | ✅ | Create DM or group |
| PUT | `/api/conversations/:id` | ✅ | Update group info |
| POST | `/api/conversations/:id/members` | ✅ | Add member |
| DELETE | `/api/conversations/:id/members/:userId` | ✅ | Remove member |

### Messages
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/messages/:conversationId` | ✅ | Get messages (paginated) |
| POST | `/api/messages` | ✅ | Send message / upload file |
| DELETE | `/api/messages/:id` | ✅ | Delete message |
| POST | `/api/messages/:id/react` | ✅ | Add/remove reaction |
| POST | `/api/messages/:id/pin` | ✅ | Pin/unpin message |
| POST | `/api/messages/read` | ✅ | Mark messages as read |

---

## 🔌 Socket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ conversationId }` | Join a chat room |
| `leave` | `{ conversationId }` | Leave a chat room |
| `send_message` | `{ conversationId, content, type, replyTo, tempId }` | Send message |
| `typing` | `{ conversationId }` | Start typing |
| `stop_typing` | `{ conversationId }` | Stop typing |
| `mark_read` | `{ conversationId, messageIds }` | Mark as read |
| `react_message` | `{ messageId, emoji, conversationId }` | React to message |
| `delete_message` | `{ messageId, conversationId, forEveryone }` | Delete message |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `receive_message` | `Message` | New message received |
| `conversation_updated` | `{ conversationId, lastMessage, unreadCount }` | Conversation updated |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId, lastSeen }` | User went offline |
| `typing` | `{ userId, username, conversationId }` | User typing |
| `stop_typing` | `{ userId, conversationId }` | User stopped typing |
| `message_read` | `{ conversationId, messageIds, readBy }` | Messages read |
| `reaction_updated` | `{ messageId, reactions }` | Reactions updated |
| `message_deleted` | `{ messageId, forEveryone }` | Message deleted |

---

## 🗄️ Database Schema

### User
```
_id, username (unique), email (unique), password (hashed),
profilePicture, bio, lastSeen, isOnline, blockedUsers[], createdAt
```

### Conversation
```
_id, participants[], isGroup, groupName, groupAvatar,
groupAdmin, admins[], lastMessage, pinnedMessages[],
mutedBy[], unreadCount{userId: count}, createdAt, updatedAt
```

### Message
```
_id, sender, conversationId, content, type (text|image|file|voice|system),
fileUrl, fileName, fileSize, mimeType, duration, status (sent|delivered|read),
readBy[{user, readAt}], deliveredTo[], replyTo, reactions[{emoji, users[]}],
isPinned, isDeleted, deletedFor[], editedAt, createdAt
```

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Connect GitHub repo to Vercel, set env vars:
# REACT_APP_API_URL=https://your-backend.onrender.com/api
# REACT_APP_SOCKET_URL=https://your-backend.onrender.com
```

### Backend → Render
1. Create a new Web Service on Render
2. Connect your GitHub repo, set root to `backend/`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables from `.env.example`
6. Use MongoDB Atlas for `MONGODB_URI`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```
REACT_APP_API_URL=https://chatapp-sim5.onrender.com/api
REACT_APP_SOCKET_URL=https://chatapp-sim5.onrender.com
```

---

## 🔒 Security Features
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with expiry
- Rate limiting on auth endpoints (100 req/15min)
- Helmet.js security headers
- CORS configured for specific origins
- File upload type validation & size limits
- Input validation with express-validator

---

## 📄 License
MIT
