const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const Order = require('../models/Order');
const Shift = require('../models/Shift');

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

// @desc    Cap nhat ho so cua nguoi dung dang dang nhap
// @route   PUT /api/users/me
// @access  Private
const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.isDeleted === true) {
      return res.status(404).json({ message: 'Khong tim thay nguoi dung' });
    }

    const { name, phone, address, avatar } = req.body;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (avatar !== undefined) user.avatar = avatar;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      position: updatedUser.position,
      phone: updatedUser.phone,
      address: updatedUser.address,
      avatar: updatedUser.avatar,
      salary: updatedUser.salary,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    res.status(400).json({ message: 'Cap nhat ho so that bai', error: error.message });
  }
};

// @desc    Doi mat khau cua nguoi dung dang dang nhap
// @route   PUT /api/users/me/password
// @access  Private
const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui long nhap day du mat khau hien tai va mat khau moi' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mat khau moi phai co it nhat 6 ky tu' });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.isDeleted === true) {
      return res.status(404).json({ message: 'Khong tim thay nguoi dung' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mat khau hien tai khong dung' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Da doi mat khau thanh cong' });
  } catch (error) {
    res.status(400).json({ message: 'Doi mat khau that bai', error: error.message });
  }
};

// @desc    Lấy danh sách người dùng (Admin và Staff)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    // Lấy tất cả user nhưng chỉ hiển thị role 'staff' hoặc 'admin' (không hiện customer)
    const users = await User.find({ role: { $in: ['admin', 'staff'] }, isDeleted: { $ne: true } }).select('-password');
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

    const [orderCount, shiftCount] = await Promise.all([
      Order.countDocuments({ staff: user._id }),
      Shift.countDocuments({ staff: user._id }),
    ]);

    if (orderCount > 0 || shiftCount > 0) {
      user.status = 'Đã nghỉ việc';
      user.isDeleted = true;
      await user.save();
      return res.json({
        message: 'Nhân viên đã phát sinh đơn/ca nên đã được chuyển trạng thái nghỉ việc thay vì xóa vĩnh viễn',
        mode: 'soft-deleted',
      });
    }

    await user.deleteOne();
    res.json({ message: 'Đã xóa người dùng', mode: 'hard-deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { getMe, updateMe, changeMyPassword, getUsers, createUser, updateUser, deleteUser };
