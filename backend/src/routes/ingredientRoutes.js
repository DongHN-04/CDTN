const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getIngredients, createIngredient, updateIngredient, deleteIngredient } = require('../controllers/ingredientController');
const { validateIngredientCreate, validateIngredientUpdate } = require('../middleware/validationMiddleware');

router.route('/')
  .get(protect, authorize('admin'), getIngredients)
  .post(protect, authorize('admin'), validateIngredientCreate, createIngredient);

router.route('/:id')
  .put(protect, authorize('admin'), validateIngredientUpdate, updateIngredient)
  .delete(protect, authorize('admin'), deleteIngredient);

module.exports = router;
