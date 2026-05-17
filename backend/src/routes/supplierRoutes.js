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
const {
  validateSupplierCreate,
  validateSupplierUpdate,
  validatePurchaseCreate,
  validatePayDebt
} = require('../middleware/validationMiddleware');

router.post('/purchase', protect, authorize('admin'), validatePurchaseCreate, createPurchase);
router.get('/purchases', protect, authorize('admin'), getPurchases);
router.put('/:id/pay-debt', protect, authorize('admin'), validatePayDebt, payDebt);

router.route('/')
  .get(protect, authorize('admin'), getSuppliers)
  .post(protect, authorize('admin'), validateSupplierCreate, createSupplier);

router.route('/:id')
  .get(protect, authorize('admin'), getSupplierById)
  .put(protect, authorize('admin'), validateSupplierUpdate, updateSupplier)
  .delete(protect, authorize('admin'), deleteSupplier);

module.exports = router;
