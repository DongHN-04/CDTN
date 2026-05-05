const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadImage, uploadMenuItemImage } = require('../controllers/uploadController');

// Route POST /api/upload - chỉ admin mới được upload ảnh
router.post('/', protect, authorize('admin'), uploadImage, uploadMenuItemImage);

module.exports = router;