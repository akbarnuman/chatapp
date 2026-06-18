const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Get user conversations
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'username email profilePicture isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username' },
      })
      .populate('pinnedMessages')
      .sort({ updatedAt: -1 });

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create or get conversation
// @route   POST /api/conversations
// @access  Private
const createConversation = async (req, res) => {
  try {
    const { participantId, isGroup, groupName, participants } = req.body;

    if (isGroup) {
      if (!groupName || !participants || participants.length < 2) {
        return res.status(400).json({ success: false, message: 'Group needs a name and at least 2 other participants' });
      }

      const allParticipants = [...new Set([req.user._id.toString(), ...participants])];
      const conversation = await Conversation.create({
        participants: allParticipants,
        isGroup: true,
        groupName,
        groupAdmin: req.user._id,
        admins: [req.user._id],
      });

      const populated = await conversation.populate('participants', 'username email profilePicture isOnline lastSeen');
      return res.status(201).json({ success: true, conversation: populated });
    }

    // Direct message - find existing or create
    const existing = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, participantId], $size: 2 },
    })
      .populate('participants', 'username email profilePicture isOnline lastSeen')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username' } });

    if (existing) {
      return res.json({ success: true, conversation: existing });
    }

    const conversation = await Conversation.create({
      participants: [req.user._id, participantId],
      isGroup: false,
    });

    const populated = await conversation.populate('participants', 'username email profilePicture isOnline lastSeen');
    res.status(201).json({ success: true, conversation: populated });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update group conversation
// @route   PUT /api/conversations/:id
// @access  Private
const updateConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isAdmin = conversation.admins.includes(req.user._id);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can update group info' });
    }

    const { groupName } = req.body;
    if (groupName) conversation.groupName = groupName;
    if (req.file) conversation.groupAvatar = `/uploads/${req.file.filename}`;

    await conversation.save();
    const populated = await conversation.populate('participants', 'username email profilePicture isOnline lastSeen');
    res.json({ success: true, conversation: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add member to group
// @route   POST /api/conversations/:id/members
// @access  Private
const addMember = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isAdmin = conversation.admins.includes(req.user._id);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can add members' });
    }

    const { userId } = req.body;
    if (conversation.participants.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already in group' });
    }

    conversation.participants.push(userId);
    await conversation.save();

    const populated = await conversation.populate('participants', 'username email profilePicture isOnline lastSeen');
    res.json({ success: true, conversation: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/conversations/:id/members/:userId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isAdmin = conversation.admins.includes(req.user._id);
    const isSelf = req.params.userId === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== req.params.userId
    );
    await conversation.save();

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getConversations, createConversation, updateConversation, addMember, removeMember };
