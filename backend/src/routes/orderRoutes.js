const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createOrder, getOrders, getOrderById } = require('../controllers/orderController');

router.route('/')
  .post(protect, authorize('admin', 'staff'), createOrder)
  .get(protect, authorize('admin', 'staff'), getOrders);

router.route('/:id')
  .get(protect, authorize('admin', 'staff'), getOrderById);

module.exports = router;