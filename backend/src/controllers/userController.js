const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Lay ho so cua nguoi dung dang dang nhap
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // Luon lay lai tu DB de frontend khong phu thuoc vao user cu trong localStorage.
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Khong tim thay nguoi dung' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Loi server' });
  }
};

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
  // Thay address thành salary để khớp với giao diện Frontend mới
  const { name, email, password, role, phone, salary, status } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    // Tách role tiếng Việt từ Frontend thành role hệ thống và chức vụ hiển thị
    const systemRole = role === 'admin' ? 'admin' : 'staff';
    const displayPosition = role === 'admin' ? 'Quản trị viên' : 'Nhân viên';

    const user = await User.create({
      name,
      email,
      password, // Nhận mật khẩu trực tiếp từ form
      role: systemRole,
      position: displayPosition,
      phone,
      salary, // Lưu mức lương
      status: status || 'Đang làm việc',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        phone: user.phone,
        salary: user.salary,
        status: user.status,
        token: generateToken(user._id, user.role), // trả token nếu cần dùng ngay
      });
    }
  } catch (error) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ', error: error.message });
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

    // Cập nhật các trường được phép
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    
    // Cập nhật lương nếu có
    if (req.body.salary !== undefined) {
      user.salary = req.body.salary;
    }

    if (req.body.status !== undefined) {
      user.status = req.body.status;
    }

    // Xử lý cập nhật chức vụ
    if (req.body.role) {
      const systemRole = req.body.role === 'admin' ? 'admin' : 'staff';
      const displayPosition = req.body.role === 'admin' ? 'Quản trị viên' : 'Nhân viên';
      user.role = systemRole;
      user.position = displayPosition;
    }

    // Chỉ cập nhật mật khẩu nếu Frontend có gửi lên (ô mật khẩu không bị bỏ trống)
    if (req.body.password) {
      user.password = req.body.password; // Sẽ được hash tự động nhờ hook pre-save của bạn
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      position: updatedUser.position,
      phone: updatedUser.phone,
      salary: updatedUser.salary,
      status: updatedUser.status,
    });
  } catch (error) {
    res.status(400).json({ message: 'Cập nhật thất bại', error: error.message });
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
    if (req.user && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Bạn không thể xóa chính mình' });
    }

    await user.deleteOne();
    res.json({ message: 'Đã xóa người dùng' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { getMe, getUsers, createUser, updateUser, deleteUser };
