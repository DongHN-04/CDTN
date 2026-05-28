const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createOrder, getOrders, getOrderById, getPendingOrders, confirmOrder, updateOrderStatus } = require('../controllers/orderController');
const { validateOrderCreate, validateOrderStatusUpdate } = require('../middleware/validationMiddleware');

router.route('/')
  .post(protect, authorize('admin', 'staff'), validateOrderCreate, createOrder)
  .get(protect, authorize('admin', 'staff'), getOrders);

router.get('/pending', protect, authorize('admin', 'staff'), getPendingOrders);
router.put('/:id/confirm', protect, authorize('admin', 'staff'), confirmOrder);
router.put('/:id/status', protect, authorize('admin', 'staff'), validateOrderStatusUpdate, updateOrderStatus);

router.route('/:id')
  .get(protect, authorize('admin', 'staff'), getOrderById);

module.exports = router;
