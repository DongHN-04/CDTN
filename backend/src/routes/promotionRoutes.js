const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion
} = require('../controllers/promotionController');

router.route('/')
  .get(protect, authorize('admin', 'staff'), getPromotions)
  .post(protect, authorize('admin'), createPromotion);

router.route('/:id')
  .put(protect, authorize('admin'), updatePromotion)
  .delete(protect, authorize('admin'), deletePromotion);

module.exports = router;