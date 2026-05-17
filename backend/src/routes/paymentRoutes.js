const express = require('express');
const router = express.Router();
const { createPayment, paymentReturn } = require('../controllers/paymentController');
const { validatePaymentCreate } = require('../middleware/validationMiddleware');

router.post('/create', validatePaymentCreate, createPayment);
router.get('/return', paymentReturn);

module.exports = router;
