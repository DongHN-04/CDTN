const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadImage, uploadMenuItemImage } = require('../controllers/uploadController');

router.post('/', protect, authorize('admin', 'staff'), uploadImage, uploadMenuItemImage);

module.exports = router;
