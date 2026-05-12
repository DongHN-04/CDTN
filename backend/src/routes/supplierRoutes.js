const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  createPurchase,
  getPurchases,
  payDebt
} = require('../controllers/supplierController');

// Purchase
router.post('/purchase', protect, authorize('admin'), createPurchase);
router.get('/purchases', protect, authorize('admin'), getPurchases); // Có thể tách route riêng nếu muốn
// Thanh toán công nợ (PUT)
router.put('/:id/pay-debt', protect, authorize('admin'), payDebt);

// CRUD Supplier
router.route('/')
  .get(protect, authorize('admin'), getSuppliers)
  .post(protect, authorize('admin'), createSupplier);

router.route('/:id')
  .get(protect, authorize('admin'), getSupplierById)
  .put(protect, authorize('admin'), updateSupplier)
  .delete(protect, authorize('admin'), deleteSupplier);

module.exports = router;