const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');

// GET và POST đều yêu cầu đăng nhập, staff cũng có thể thêm khách hàng mới khi bán hàng
router.route('/')
  .get(protect, authorize('admin', 'staff'), getCustomers)
  .post(protect, authorize('admin', 'staff'), createCustomer);

// PUT và DELETE: chỉ Admin mới được xóa, sửa thì admin+staff
router.route('/:id')
  .put(protect, authorize('admin', 'staff'), updateCustomer)
  .delete(protect, authorize('admin'), deleteCustomer);

module.exports = router;