const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getShifts,
  getMyShifts,
  createShift,
  updateShift,
  assignStaff,
  closeShift,
  deleteShift
} = require('../controllers/shiftController');

// 1. Route cho nhân viên xem ca của mình (đặt trước tất cả)
router.get('/mine', protect, authorize('admin', 'staff'), getMyShifts);

// 2. Route chính cho Admin (GET và POST)
router.route('/')
  .get(protect, authorize('admin'), getShifts)
  .post(protect, authorize('admin'), createShift);

// 3. Route phân ca (PUT /:id/assign)
router.put('/:id/assign', protect, authorize('admin'), assignStaff);

// 4. Route đóng ca (PUT /:id/close)
router.put('/:id/close', protect, closeShift);

// 5. Route với :id (phải đặt cuối cùng)
router.route('/:id')
  .put(protect, authorize('admin'), updateShift)
  .delete(protect, authorize('admin'), deleteShift);

module.exports = router;