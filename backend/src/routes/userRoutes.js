const express = require('express');
const router = express.Router();
const {
  getMe,
  updateMe,
  changeMyPassword,
  getUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  validateUserCreate,
  validateUserUpdate,
  validateProfileUpdate,
  validatePasswordChange,
} = require('../middleware/validationMiddleware');

router.route('/me')
  .get(protect, getMe)
  .put(protect, validateProfileUpdate, updateMe);

router.put('/me/password', protect, validatePasswordChange, changeMyPassword);

router.route('/')
  .get(protect, authorize('admin'), getUsers)
  .post(protect, authorize('admin'), validateUserCreate, createUser);

router.route('/:id')
  .put(protect, authorize('admin'), validateUserUpdate, updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
