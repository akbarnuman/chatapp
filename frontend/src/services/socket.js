import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinConversation = (conversationId) => {
  socket?.emit('join', { conversationId });
};

export const leaveConversation = (conversationId) => {
  socket?.emit('leave', { conversationId });
};

export const sendSocketMessage = (data) => {
  socket?.emit('send_message', data);
};

export const emitTyping = (conversationId) => {
  socket?.emit('typing', { conversationId });
};

export const emitStopTyping = (conversationId) => {
  socket?.emit('stop_typing', { conversationId });
};

export const emitMarkRead = (conversationId, messageIds) => {
  socket?.emit('mark_read', { conversationId, messageIds });
};

export const emitReaction = (messageId, emoji, conversationId) => {
  socket?.emit('react_message', { messageId, emoji, conversationId });
};

export const emitDeleteMessage = (messageId, conversationId, forEveryone) => {
  socket?.emit('delete_message', { messageId, conversationId, forEveryone });
};
