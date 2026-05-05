const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Lấy danh sách người dùng (Admin và Staff)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    // Lấy tất cả user nhưng chỉ hiển thị role 'staff' hoặc 'admin' (không hiện customer)
    const users = await User.find({ role: { $in: ['admin', 'staff'] } }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Tạo nhân viên mới (chỉ Admin)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'staff', // mặc định là staff
      phone,
      address,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        token: generateToken(user._id, user.role), // trả token nếu cần dùng ngay
      });
    }
  } catch (error) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
  }
};

// @desc    Cập nhật thông tin nhân viên
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Cập nhật các trường được phép (không cho đổi email nếu đã tồn tại ở người khác)
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    user.role = req.body.role || user.role; // Admin có thể thay đổi role

    if (req.body.password) {
      user.password = req.body.password; // Sẽ được hash tự động nhờ hook pre-save
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      address: updatedUser.address,
    });
  } catch (error) {
    res.status(400).json({ message: 'Cập nhật thất bại' });
  }
};

// @desc    Xóa người dùng
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Ngăn admin xóa chính mình
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Bạn không thể xóa chính mình' });
    }

    await user.deleteOne();
    res.json({ message: 'Đã xóa người dùng' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };