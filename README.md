# 💬 ChatApp — Real-Time Messaging Platform

A production-quality WhatsApp Web–inspired chat application built with React, Node.js, Socket.IO, MongoDB, and Cloudinary.

---

## 🚀 Live Demo

🌐 **Application**
https://chatapp-akbarnuman.vercel.app

🔗 **Backend API**
https://chatapp-sim5.onrender.com

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
- 📷 Image sharing (Cloudinary)
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
- 🖼️ Profile picture upload (Cloudinary)
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
| File Storage | Cloudinary |
| File Upload | Multer + multer-storage-cloudinary |
| Security | Helmet, express-rate-limit |
| Deployment | Vercel (Frontend), Render (Backend) |

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
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (free)
- npm or yarn

### 1. Clone & setup environment

```bash
git clone https://github.com/akbarnuman/chatapp
cd chatapp
```

### 2. Backend

```bash
cd backend
npm install --legacy-peer-deps
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (`frontend/.env`)
```
REACT_APP_API_URL=https://chatapp-sim5.onrender.com/api
REACT_APP_SOCKET_URL=https://chatapp-sim5.onrender.com
```

---

## 🌐 Deployment

### Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Set Root Directory: `frontend`
3. Add environment variables:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   REACT_APP_SOCKET_URL=https://your-backend.onrender.com
   ```

### Backend → Render
1. Create a new Web Service on Render
2. Connect GitHub repo, set root to `backend/`
3. Build command: `npm install --legacy-peer-deps`
4. Start command: `node server.js`
5. Add environment variables from `.env.example`

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
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId, lastSeen }` | User went offline |
| `typing` | `{ userId, username, conversationId }` | User typing |
| `stop_typing` | `{ userId, conversationId }` | User stopped typing |
| `message_read` | `{ conversationId, messageIds, readBy }` | Messages read |
| `reaction_updated` | `{ messageId, reactions }` | Reactions updated |
| `message_deleted` | `{ messageId, forEveryone }` | Message deleted |

---

## 🔒 Security Features
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with expiry
- Rate limiting on auth endpoints (100 req/15min)
- Helmet.js security headers
- CORS configured for specific origins
- File upload type validation & size limits

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
groupAdmin, lastMessage, pinnedMessages[],
unreadCount{userId: count}, createdAt, updatedAt
```

### Message
```
_id, sender, conversationId, content, type (text|image|file|voice|system),
fileUrl, fileName, fileSize, mimeType, status (sent|delivered|read),
readBy[{user, readAt}], replyTo, reactions[{emoji, users[]}],
isPinned, isDeleted, deletedFor[], createdAt
```

---

## 👨‍💻 Author

**Md Akbar Ansari**

If you found this project interesting, consider giving it a ⭐ on GitHub.
