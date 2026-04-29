const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Đăng ký tài khoản mới (mặc định role = 'customer')
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  try {
    // Kiểm tra email đã tồn tại chưa
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Tạo user mới, role mặc định là 'customer'
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: 'customer', // khách hàng đăng ký luôn là customer
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Đăng nhập cho tất cả các role
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  console.log('Request body:', req.body); // test api login nhận được gì
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    // Kiểm tra user tồn tại và mật khẩu khớp
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser };