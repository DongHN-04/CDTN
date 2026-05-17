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
const {
  validateShiftCreate,
  validateShiftUpdate,
  validateAssignStaff,
  validateCloseShift
} = require('../middleware/validationMiddleware');

router.get('/mine', protect, authorize('admin', 'staff'), getMyShifts);

router.route('/')
  .get(protect, authorize('admin'), getShifts)
  .post(protect, authorize('admin'), validateShiftCreate, createShift);

router.put('/:id/assign', protect, authorize('admin'), validateAssignStaff, assignStaff);
router.put('/:id/close', protect, validateCloseShift, closeShift);

router.route('/:id')
  .put(protect, authorize('admin'), validateShiftUpdate, updateShift)
  .delete(protect, authorize('admin'), deleteShift);

module.exports = router;
