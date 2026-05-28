const express = require('express');
const router = express.Router();
const { getMenu, createOrder, getMyOrders, getCombos, getPromotions, getHomepageData } = require('../controllers/publicController');
const rateLimit = require('../middleware/rateLimitMiddleware');
const { validatePublicOrderCreate } = require('../middleware/validationMiddleware');
const { protect, optionalProtect, authorize } = require('../middleware/authMiddleware');

const publicOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: 'Bạn tạo đơn quá nhiều lần, vui lòng thử lại sau',
});

router.get('/menu', getMenu);
router.get('/combos', getCombos);
router.get('/promotions', getPromotions);
router.get('/homepage', getHomepageData);
router.get('/my-orders', protect, authorize('customer'), getMyOrders);
router.post('/orders', publicOrderLimiter, optionalProtect, validatePublicOrderCreate, createOrder);

module.exports = router;
