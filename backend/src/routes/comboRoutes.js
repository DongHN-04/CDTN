const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getCombos,
  createCombo,
  updateCombo,
  deleteCombo
} = require('../controllers/comboController');

router.route('/')
  .get(protect, authorize('admin', 'staff'), getCombos)
  .post(protect, authorize('admin'), createCombo);

router.route('/:id')
  .put(protect, authorize('admin'), updateCombo)
  .delete(protect, authorize('admin'), deleteCombo);

module.exports = router;