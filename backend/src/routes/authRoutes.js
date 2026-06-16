const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, verifyOTP, resetPassword } = require('../controllers/authController');
const rateLimit = require('../middleware/rateLimitMiddleware');
const { validateAuthRegister, validateAuthLogin } = require('../middleware/validationMiddleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Bạn thử thao tác quá nhiều lần, vui lòng thử lại sau',
});

router.post('/register', authLimiter, validateAuthRegister, registerUser);
router
  .route('/login')
  .post(authLimiter, validateAuthLogin, loginUser)
  .all((req, res) => {
    res.status(405).json({
      message: 'Đăng nhập phải dùng phương thức POST',
      method: 'POST',
      path: '/api/auth/login',
      body: {
        email: 'admin@example.com',
        password: 'your-password',
      },
    });
  });

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
