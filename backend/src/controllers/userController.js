const User = require('../models/User');
const Customer = require('../models/Customer');
const generateToken = require('../utils/generateToken');
const Order = require('../models/Order');
const Shift = require('../models/Shift');

const buildUserContactFilter = ({ email, phone }, excludeUserId = null) => {
  const or = [];
  if (email) or.push({ email: email.toLowerCase() });
  if (phone) or.push({ phone });
  if (or.length === 0) return null;

  const filter = { isDeleted: { $ne: true }, $or: or };
  if (excludeUserId) filter._id = { $ne: excludeUserId };
  return filter;
};

const buildCustomerContactFilter = ({ email, phone }) => {
  const or = [];
  if (email) or.push({ email: email.toLowerCase() });
  if (phone) or.push({ phone });
  if (or.length === 0) return null;
  return { isDeleted: { $ne: true }, $or: or };
};

const getContactDuplicateMessage = (duplicate, { email, phone }) => {
  if (email && duplicate.email?.toLowerCase() === email.toLowerCase()) return 'Email đã tồn tại trong hệ thống';
  if (phone && duplicate.phone === phone) return 'Số điện thoại đã tồn tại trong hệ thống';
  return 'Email hoặc số điện thoại đã tồn tại trong hệ thống';
};

const assertUniqueAccountContact = async ({ email, phone }, { excludeUserId = null, allowCustomerEmail = '' } = {}) => {
  const userFilter = buildUserContactFilter({ email, phone }, excludeUserId);
  const duplicateUser = userFilter ? await User.findOne(userFilter) : null;
  if (duplicateUser) {
    return getContactDuplicateMessage(duplicateUser, { email, phone });
  }

  const customerFilter = buildCustomerContactFilter({ email, phone });
  const duplicateCustomer = customerFilter ? await Customer.findOne(customerFilter) : null;
  const isAllowedLinkedCustomer = duplicateCustomer
    && allowCustomerEmail
    && duplicateCustomer.email?.toLowerCase() === allowCustomerEmail.toLowerCase();

  if (duplicateCustomer && !isAllowedLinkedCustomer) {
    return getContactDuplicateMessage(duplicateCustomer, { email, phone });
  }

  return '';
};

// @desc    Lay ho so cua nguoi dung dang dang nhap
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // Luon lay lai tu DB de frontend khong phu thuoc vao user cu trong localStorage.
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// @desc    Cap nhat ho so cua nguoi dung dang dang nhap
// @route   PUT /api/users/me
// @access  Private
const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.isDeleted === true) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const { name, phone, address, addresses, avatar } = req.body;
    if (phone !== undefined) {
      const duplicateMessage = await assertUniqueAccountContact(
        { phone },
        { excludeUserId: user._id, allowCustomerEmail: user.role === 'customer' ? user.email : '' }
      );
      if (duplicateMessage) {
        return res.status(400).json({ message: duplicateMessage });
      }
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (addresses !== undefined) user.addresses = addresses;
    if (avatar !== undefined) user.avatar = avatar;

    const updatedUser = await user.save();
    if (updatedUser.role === 'customer') {
      await Customer.findOneAndUpdate(
        { email: updatedUser.email, isDeleted: { $ne: true } },
        {
          $set: {
            name: updatedUser.name,
            phone: updatedUser.phone || '',
            email: updatedUser.email,
          },
          $setOnInsert: {
            type: 'Thường',
            notes: '',
            isActive: true,
            isDeleted: false,
          },
        },
        { upsert: true, new: true }
      );
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      position: updatedUser.position,
      phone: updatedUser.phone,
      address: updatedUser.address,
      addresses: updatedUser.addresses || [],
      savedPromotions: updatedUser.savedPromotions || [],
      avatar: updatedUser.avatar,
      salary: updatedUser.salary,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    res.status(400).json({ message: 'Cập nhật hồ sơ thất bại', error: error.message });
  }
};

// @desc    Doi mat khau cua nguoi dung dang dang nhap
// @route   PUT /api/users/me/password
// @access  Private
const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.isDeleted === true) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Đã đổi mật khẩu thành công' });
  } catch (error) {
    res.status(400).json({ message: 'Đổi mật khẩu thất bại', error: error.message });
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
    const duplicateMessage = await assertUniqueAccountContact({ email, phone });
    if (duplicateMessage) {
      return res.status(400).json({ message: duplicateMessage });
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

    const nextEmail = req.body.email || user.email;
    const nextPhone = req.body.phone ?? user.phone;
    const duplicateMessage = await assertUniqueAccountContact(
      { email: nextEmail, phone: nextPhone },
      { excludeUserId: user._id, allowCustomerEmail: user.role === 'customer' ? user.email : '' }
    );
    if (duplicateMessage) {
      return res.status(400).json({ message: duplicateMessage });
    }

    // Cập nhật các trường được phép
    user.name = req.body.name || user.name;
    user.email = nextEmail;
    user.phone = nextPhone;

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

    // Ngăn xóa tài khoản Quản trị viên
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Không thể xóa tài khoản Quản trị viên' });
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
