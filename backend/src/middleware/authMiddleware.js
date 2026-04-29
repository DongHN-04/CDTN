const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware bảo vệ route: kiểm tra token hợp lệ và gán thông tin user vào req.user
 */
const protect = async (req, res, next) => {
  let token;

  // Kiểm tra header Authorization có dạng "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Xác thực token và giải mã
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin user từ DB (loại bỏ trường password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Middleware phân quyền: chỉ cho phép các role được chỉ định truy cập
 * @param  {...String} roles - Danh sách các role được phép (ví dụ: 'admin', 'staff')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Đảm bảo middleware protect đã chạy trước và gán req.user
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user.role} is not authorized to access this route`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };