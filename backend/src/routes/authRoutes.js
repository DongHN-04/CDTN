const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const rateLimit = require('../middleware/rateLimitMiddleware');
const { validateAuthRegister, validateAuthLogin } = require('../middleware/validationMiddleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Bạn thử đăng nhập/đăng ký quá nhiều lần, vui lòng thử lại sau',
});

router.post('/register', authLimiter, validateAuthRegister, registerUser);
router.post('/login', authLimiter, validateAuthLogin, loginUser);

module.exports = router;
