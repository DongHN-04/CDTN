const express = require('express');
const router = express.Router();
const { createPayment, paymentReturn } = require('../controllers/paymentController');
const { validatePaymentCreate } = require('../middleware/validationMiddleware');
const rateLimit = require('../middleware/rateLimitMiddleware');

const paymentCreateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: 'Ban tao giao dich thanh toan qua nhieu lan, vui long thu lai sau',
});

router.post('/create', paymentCreateLimiter, validatePaymentCreate, createPayment);
router.get('/return', paymentReturn);

module.exports = router;
