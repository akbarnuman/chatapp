const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @desc    Get messages for conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, search } = req.query;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let query = {
      conversationId,
      isDeleted: false,
      deletedFor: { $ne: req.user._id },
    };

    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username profilePicture')
      .populate('replyTo', 'content sender type')
      .populate('readBy.user', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text', replyTo } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messageData = {
      sender: req.user._id,
      conversationId,
      content,
      type,
    };

    if (replyTo) messageData.replyTo = replyTo;

    if (req.file) {
      messageData.fileUrl = `/uploads/${req.file.filename}`;
      messageData.fileName = req.file.originalname;
      messageData.fileSize = req.file.size;
      messageData.mimeType = req.file.mimetype;
      messageData.type = req.file.mimetype.startsWith('image/') ? 'image'
        : req.file.mimetype.startsWith('audio/') ? 'voice' : 'file';
    }

    const message = await Message.create(messageData);
    await message.populate('sender', 'username profilePicture');
    if (replyTo) await message.populate('replyTo', 'content sender type');

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();

    // Increment unread for other participants
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user._id.toString()) {
        const current = conversation.unreadCount.get(participantId.toString()) || 0;
        conversation.unreadCount.set(participantId.toString(), current + 1);
      }
    });

    await conversation.save();

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const { forEveryone } = req.body;
    const isSender = message.sender.toString() === req.user._id.toString();

    if (forEveryone && isSender) {
      message.isDeleted = true;
      message.content = 'This message was deleted';
    } else {
      message.deletedFor.push(req.user._id);
    }

    await message.save();
    res.json({ success: true, message: 'Message deleted', forEveryone: forEveryone && isSender });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:id/react
// @access  Private
const reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const existingReaction = message.reactions.find((r) => r.emoji === emoji);

    if (existingReaction) {
      const userIndex = existingReaction.users.indexOf(req.user._id);
      if (userIndex > -1) {
        existingReaction.users.splice(userIndex, 1);
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(req.user._id);
      }
    } else {
      message.reactions.push({ emoji, users: [req.user._id] });
    }

    await message.save();
    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Pin/Unpin message
// @route   POST /api/messages/:id/pin
// @access  Private
const pinMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    message.isPinned = !message.isPinned;
    await message.save();

    if (message.isPinned) {
      conversation.pinnedMessages.push(message._id);
    } else {
      conversation.pinnedMessages = conversation.pinnedMessages.filter(
        (m) => m.toString() !== message._id.toString()
      );
    }
    await conversation.save();

    res.json({ success: true, isPinned: message.isPinned });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark messages as read
// @route   POST /api/messages/read
// @access  Private
const markRead = async (req, res) => {
  try {
    const { conversationId } = req.body;

    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id },
      },
      {
        $push: { readBy: { user: req.user._id, readAt: new Date() } },
        $set: { status: 'read' },
      }
    );

    // Reset unread count
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      conversation.unreadCount.set(req.user._id.toString(), 0);
      await conversation.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMessages, sendMessage, deleteMessage, reactToMessage, pinMessage, markRead };
