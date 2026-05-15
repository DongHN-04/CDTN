const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion
} = require('../controllers/promotionController');
const { validatePromotionCreate, validatePromotionUpdate } = require('../middleware/validationMiddleware');

router.route('/')
  .get(protect, authorize('admin', 'staff'), getPromotions)
  .post(protect, authorize('admin'), validatePromotionCreate, createPromotion);

router.route('/:id')
  .put(protect, authorize('admin'), validatePromotionUpdate, updatePromotion)
  .delete(protect, authorize('admin'), deletePromotion);

module.exports = router;
