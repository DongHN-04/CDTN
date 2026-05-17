const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getCombos,
  createCombo,
  updateCombo,
  deleteCombo
} = require('../controllers/comboController');
const { validateComboCreate, validateComboUpdate } = require('../middleware/validationMiddleware');

router.route('/')
  .get(protect, authorize('admin', 'staff'), getCombos)
  .post(protect, authorize('admin'), validateComboCreate, createCombo);

router.route('/:id')
  .put(protect, authorize('admin'), validateComboUpdate, updateCombo)
  .delete(protect, authorize('admin'), deleteCombo);

module.exports = router;
