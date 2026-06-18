const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const onlineUsers = new Map(); // userId -> socketId
const typingUsers = new Map(); // conversationId -> Set of userIds

const socketHandler = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

    // Register user as online
    onlineUsers.set(userId, socket.id);

    // Update DB
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Broadcast online status
    socket.broadcast.emit('user_online', { userId, isOnline: true });

    // Join user to their conversation rooms
    socket.on('join', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });
        if (conversation) {
          socket.join(conversationId);
          console.log(`📥 ${socket.user.username} joined room: ${conversationId}`);
        }
      } catch (err) {
        console.error('Join error:', err);
      }
    });

    socket.on('leave', ({ conversationId }) => {
      socket.leave(conversationId);
    });

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, type = 'text', replyTo, tempId } = data;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (!conversation) return;

        const messageData = {
          sender: userId,
          conversationId,
          content,
          type,
          status: 'sent',
        };

        if (replyTo) messageData.replyTo = replyTo;

        const message = await Message.create(messageData);
        await message.populate('sender', 'username profilePicture');
        if (replyTo) await message.populate('replyTo', 'content sender type');

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();

        // Mark as delivered to online participants
        const deliveredTo = [];
        conversation.participants.forEach((participantId) => {
          const pid = participantId.toString();
          if (pid !== userId) {
            // Increment unread
            const current = conversation.unreadCount.get(pid) || 0;
            conversation.unreadCount.set(pid, current + 1);

            // Check if online
            if (onlineUsers.has(pid)) {
              deliveredTo.push(participantId);
            }
          }
        });

        if (deliveredTo.length > 0) {
          message.deliveredTo = deliveredTo;
          message.status = 'delivered';
        }

        await Promise.all([conversation.save(), message.save()]);

        // Emit to all in room
        io.to(conversationId).emit('receive_message', {
          ...message.toObject(),
          tempId,
        });

        // Emit conversation update to all participants
        conversation.participants.forEach((participantId) => {
          const pid = participantId.toString();
          const socketId = onlineUsers.get(pid);
          if (socketId && pid !== userId) {
            io.to(socketId).emit('conversation_updated', {
              conversationId,
              lastMessage: message,
              unreadCount: conversation.unreadCount.get(pid) || 0,
            });
          }
        });
      } catch (err) {
        console.error('Send message socket error:', err);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId }) => {
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set());
      }
      typingUsers.get(conversationId).add(userId);

      socket.to(conversationId).emit('typing', {
        userId,
        username: socket.user.username,
        conversationId,
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      if (typingUsers.has(conversationId)) {
        typingUsers.get(conversationId).delete(userId);
      }
      socket.to(conversationId).emit('stop_typing', { userId, conversationId });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ conversationId, messageIds }) => {
      try {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversationId,
            sender: { $ne: userId },
            'readBy.user': { $ne: userId },
          },
          {
            $push: { readBy: { user: userId, readAt: new Date() } },
            $set: { status: 'read' },
          }
        );

        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.unreadCount.set(userId, 0);
          await conversation.save();
        }

        // Notify senders that messages were read
        socket.to(conversationId).emit('message_read', {
          conversationId,
          messageIds,
          readBy: userId,
        });
      } catch (err) {
        console.error('Mark read error:', err);
      }
    });

    // React to message
    socket.on('react_message', async ({ messageId, emoji, conversationId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingReaction = message.reactions.find((r) => r.emoji === emoji);
        if (existingReaction) {
          const userIndex = existingReaction.users.findIndex((u) => u.toString() === userId);
          if (userIndex > -1) {
            existingReaction.users.splice(userIndex, 1);
            if (existingReaction.users.length === 0) {
              message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
            }
          } else {
            existingReaction.users.push(userId);
          }
        } else {
          message.reactions.push({ emoji, users: [userId] });
        }

        await message.save();
        io.to(conversationId).emit('reaction_updated', {
          messageId,
          reactions: message.reactions,
        });
      } catch (err) {
        console.error('React error:', err);
      }
    });

    // Delete message
    socket.on('delete_message', async ({ messageId, conversationId, forEveryone }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const isSender = message.sender.toString() === userId;
        if (forEveryone && isSender) {
          message.isDeleted = true;
          message.content = 'This message was deleted';
          await message.save();
          io.to(conversationId).emit('message_deleted', { messageId, forEveryone: true });
        } else {
          message.deletedFor.push(userId);
          await message.save();
          socket.emit('message_deleted', { messageId, forEveryone: false });
        }
      } catch (err) {
        console.error('Delete message error:', err);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.username}`);
      onlineUsers.delete(userId);

      // Clear typing indicators
      typingUsers.forEach((users, convId) => {
        if (users.has(userId)) {
          users.delete(userId);
          socket.to(convId).emit('stop_typing', { userId, conversationId: convId });
        }
      });

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      socket.broadcast.emit('user_offline', { userId, lastSeen: new Date() });
    });
  });
};

module.exports = { socketHandler, onlineUsers };
