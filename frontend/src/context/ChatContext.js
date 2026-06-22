import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';
import { conversationAPI, messageAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const typingTimers = useRef({});

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await conversationAPI.getConversations();
      setConversations(data.conversations);
    } catch {}
  }, []);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  // Load messages
  const loadMessages = useCallback(async (conversationId, p = 1) => {
    setLoadingMessages(true);
    try {
      const { data } = await messageAPI.getMessages(conversationId, { page: p, limit: 50 });
      if (p === 1) setMessages(data.messages);
      else setMessages(prev => [...data.messages, ...prev]);
      setHasMore(p < data.pagination.pages);
      setPage(p);
    } catch {} finally {
      setLoadingMessages(false);
    }
  }, []);

  const selectConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    setPage(1);
    const socket = getSocket();
    if (activeConversation) socket?.emit('leave', { conversationId: activeConversation._id });
    socket?.emit('join', { conversationId: conversation._id });
    await loadMessages(conversation._id, 1);
    // Mark read
    await messageAPI.markRead(conversation._id).catch(() => {});
    setConversations(prev => prev.map(c =>
      c._id === conversation._id
        ? { ...c, unreadCount: { ...c.unreadCount, [user._id]: 0 } }
        : c
    ));
  }, [activeConversation, loadMessages, user]);

  // Socket events
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    socket.on('receive_message', (message) => {
      if (message.conversationId === activeConversation?._id) {
        setMessages(prev => {
          const exists = prev.find(m => m._id === message._id || m.tempId === message.tempId);
          if (exists) return prev.map(m => m._id === message._id || m.tempId === message.tempId ? message : m);
          return [...prev, message];
        });
        // Mark read immediately if active
        messageAPI.markRead(message.conversationId).catch(() => {});
      }
      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === message.conversationId);
        if (idx === -1) { fetchConversations(); return prev; }
        const updated = [...prev];
        const conv = { ...updated[idx], lastMessage: message, updatedAt: new Date() };
        if (message.conversationId !== activeConversation?._id) {
          const unread = conv.unreadCount || {};
          conv.unreadCount = { ...unread, [user._id]: (unread[user._id] || 0) + 1 };
        }
        updated.splice(idx, 1);
        return [conv, ...updated];
      });
    });

    socket.on('typing', ({ userId, username, conversationId }) => {
      if (conversationId === activeConversation?._id && userId !== user._id) {
        setTypingUsers(prev => ({ ...prev, [conversationId]: { userId, username } }));
      }
    });

    socket.on('stop_typing', ({ userId, conversationId }) => {
      setTypingUsers(prev => {
        const n = { ...prev };
        if (n[conversationId]?.userId === userId) delete n[conversationId];
        return n;
      });
    });

    socket.on('user_online', ({ userId }) => setOnlineUsers(prev => new Set([...prev, userId])));
    socket.on('user_offline', ({ userId }) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(userId); return s; }));

    socket.on('reaction_updated', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    });

    socket.on('message_deleted', ({ messageId, forEveryone }) => {
      if (forEveryone) {
        setMessages(prev => prev.map(m => m._id === messageId
          ? { ...m, isDeleted: true, content: 'This message was deleted' } : m));
      } else {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
    });

    socket.on('message_read', ({ messageIds }) => {
      setMessages(prev => prev.map(m =>
        messageIds.includes(m._id) ? { ...m, status: 'read' } : m
      ));
    });

    return () => {
      socket.off('receive_message');
      socket.off('typing');
      socket.off('stop_typing');
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('reaction_updated');
      socket.off('message_deleted');
      socket.off('message_read');
    };
  }, [user, activeConversation, fetchConversations]);

 const sendMessage = useCallback(async (content, type = 'text', replyTo = null, file = null) => {
    const socket = getSocket();
    if (!activeConversation) return;

    const tempId = Date.now().toString();
    const tempMsg = {
      _id: tempId, tempId, content, type,
      sender: user, conversationId: activeConversation._id,
      createdAt: new Date(), status: 'sent',
      replyTo, reactions: [], isPending: true,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      if (file) {
        // ✅ File hai tो API se bhejo
        const fd = new FormData();
        fd.append('conversationId', activeConversation._id);
        fd.append('file', file);
        if (content) fd.append('content', content);
        if (replyTo) fd.append('replyTo', replyTo);
        fd.append('tempId', tempId);
        const { data } = await messageAPI.sendMessage(fd);
        // Socket se baaki users ko notify karo
        socket?.emit('send_message', { 
          conversationId: activeConversation._id, 
          messageId: data.message._id,
          tempId 
        });
        // Temp message replace karo
        setMessages(prev => prev.map(m => m.tempId === tempId ? data.message : m));
      } else {
        // ✅ Text message socket se bhejo
        socket?.emit('send_message', { 
          conversationId: activeConversation._id, 
          content, type, replyTo, tempId 
        });
      }
    } catch (error) {
      // Failed — temp message hatao
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
      toast.error('Message send failed');
    }
  }, [activeConversation, user])};