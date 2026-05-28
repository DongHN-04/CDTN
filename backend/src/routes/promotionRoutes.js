const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getBanners,
  createBanner,
  deleteBanner,
  setActiveBanner
} = require('../controllers/promotionController');
const {
  validatePromotionCreate,
  validatePromotionUpdate,
  validateBannerCreate,
} = require('../middleware/validationMiddleware');

// Banner routes
router.route('/banners')
  .get(protect, authorize('admin', 'staff'), getBanners)
  .post(protect, authorize('admin'), validateBannerCreate, createBanner);

router.route('/banners/:id')
  .delete(protect, authorize('admin'), deleteBanner);

router.route('/banners/:id/active')
  .put(protect, authorize('admin'), setActiveBanner);

// Promotion routes
router.route('/')
  .get(protect, authorize('admin', 'staff'), getPromotions)
  .post(protect, authorize('admin'), validatePromotionCreate, createPromotion);

router.route('/:id')
  .put(protect, authorize('admin'), validatePromotionUpdate, updatePromotion)
  .delete(protect, authorize('admin'), deletePromotion);

module.exports = router;
