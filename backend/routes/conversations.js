const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConversations, createConversation, updateConversation, addMember, removeMember
} = require('../controllers/conversationController');

router.get('/', protect, getConversations);
router.post('/', protect, createConversation);
router.put('/:id', protect, updateConversation);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;
