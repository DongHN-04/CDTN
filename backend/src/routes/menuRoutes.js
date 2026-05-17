const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } = require('../controllers/menuController');
const { validateMenuItemCreate, validateMenuItemUpdate } = require('../middleware/validationMiddleware');

router.route('/')
  .get(protect, getMenuItems)
  .post(protect, authorize('admin'), validateMenuItemCreate, createMenuItem);

router.route('/:id')
  .put(protect, authorize('admin'), validateMenuItemUpdate, updateMenuItem)
  .delete(protect, authorize('admin'), deleteMenuItem);

module.exports = router;
