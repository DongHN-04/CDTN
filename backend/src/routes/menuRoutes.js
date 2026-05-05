const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } = require('../controllers/menuController');

// Cho phép cả admin và staff xem menu (dùng chung route sau này), nhưng chỉ admin mới thêm/sửa/xóa
router.route('/')
  .get(protect, getMenuItems) // không authorize admin vì staff cũng cần xem
  .post(protect, authorize('admin'), createMenuItem);
router.route('/:id')
  .put(protect, authorize('admin'), updateMenuItem)
  .delete(protect, authorize('admin'), deleteMenuItem);

module.exports = router;