const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const Customer = require('../models/Customer');

/**
 * @desc    Đăng ký tài khoản mới (mặc định role = 'customer')
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  try {
    // Kiểm tra email đã tồn tại trong User chưa
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    // Tạo user mới với role mặc định 'customer'
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: 'customer',
    });

    if (user) {
      // Tự động thêm vào danh sách khách hàng nếu chưa có
      let customer = await Customer.findOne({ email });

      if (customer) {
        // Cập nhật thông tin nếu khách hàng đã tồn tại (có thể do admin thêm trước)
        customer.name = name || customer.name;
        customer.phone = phone || customer.phone;
        await customer.save();
      } else {
        // Tạo mới khách hàng
        await Customer.create({
          name,
          email,
          phone: phone || '',
          type: 'Thường', // Mặc định là khách thường
          notes: '',
        });
      }

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
      res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi server' });
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