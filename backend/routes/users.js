const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/auth');
const { getUsers, getUserById, updateUser, blockUser } = require('../controllers/userController');

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Cloudinary storage — disk ki jagah
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chat-app/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }], // auto resize
  },
});

const upload = multer({
  storage,  // ← bas yahi change hua
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed for avatars'));
  },
});

router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, upload.single('profilePicture'), updateUser);
router.post('/:id/block', protect, blockUser);

module.exports = router;