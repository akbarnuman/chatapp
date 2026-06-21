const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/auth');
const {
  getMessages, sendMessage, deleteMessage, reactToMessage, pinMessage, markRead
} = require('../controllers/messageController');

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    // Video/audio alag folder mein
    const isVideo = file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/');
    return {
      folder: isVideo ? 'chat-app/videos' : 'chat-app/files',
      resource_type: isVideo ? 'video' : 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mp3', 'pdf'],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get('/:conversationId', protect, getMessages);
router.post('/', protect, upload.single('file'), sendMessage);
router.delete('/:id', protect, deleteMessage);
router.post('/:id/react', protect, reactToMessage);
router.post('/:id/pin', protect, pinMessage);
router.post('/read',