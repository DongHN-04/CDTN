const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getIngredients, createIngredient, updateIngredient, deleteIngredient } = require('../controllers/ingredientController');

router.route('/')
  .get(protect, authorize('admin'), getIngredients)
  .post(protect, authorize('admin'), createIngredient);
router.route('/:id')
  .put(protect, authorize('admin'), updateIngredient)
  .delete(protect, authorize('admin'), deleteIngredient);

module.exports = router;