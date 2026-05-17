const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const { validateCustomerCreate, validateCustomerUpdate } = require('../middleware/validationMiddleware');

router.route('/')
  .get(protect, authorize('admin', 'staff'), getCustomers)
  .post(protect, authorize('admin', 'staff'), validateCustomerCreate, createCustomer);

router.route('/:id')
  .put(protect, authorize('admin', 'staff'), validateCustomerUpdate, updateCustomer)
  .delete(protect, authorize('admin'), deleteCustomer);

module.exports = router;
