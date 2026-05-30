const crypto = require('crypto');
const User = require('../models/User');
const Customer = require('../models/Customer');
const generateToken = require('../utils/generateToken');
const { ApiError, asyncHandler } = require('../middleware/errorMiddleware');

const buildAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
  addresses: user.addresses || [],
  savedPromotions: user.savedPromotions || [],
  avatar: user.avatar,
  token: generateToken(user._id, user.role),
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  const existingUserByEmail = await User.findOne({ email });
  if (existingUserByEmail) {
    throw new ApiError(409, 'Email đã tồn tại trong hệ thống');
  }

  if (phone) {
    const existingUserByPhone = await User.findOne({ phone });
    if (existingUserByPhone) {
      throw new ApiError(409, 'Số điện thoại đã tồn tại trong hệ thống');
    }
  }

  const customerLookup = [];
  if (email) customerLookup.push({ email });
  if (phone) customerLookup.push({ phone });

  const existingCustomer = customerLookup.length
    ? await Customer.find({ isDeleted: { $ne: true }, $or: customerLookup })
    : [];
  const duplicatedCustomer = existingCustomer[0];
  if (duplicatedCustomer) {
    if (duplicatedCustomer.email?.toLowerCase() === email) {
      throw new ApiError(409, 'Email đã thuộc về khách hàng khác');
    }
    if (phone && duplicatedCustomer.phone === phone) {
      throw new ApiError(409, 'Số điện thoại đã thuộc về khách hàng khác');
    }
    throw new ApiError(409, 'Thông tin đăng ký đã tồn tại trong hệ thống');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    role: 'customer',
  });

  await Customer.create({
    name,
    email,
    phone: phone || '',
    type: 'Thường',
    notes: '',
  });

  res.status(201).json(buildAuthResponse(user));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.isDeleted === true || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Email hoặc mật khẩu không đúng');
  }

  res.json(buildAuthResponse(user));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.isDeleted === true) {
    throw new ApiError(404, 'Không tìm thấy tài khoản với email này');
  }

  const resetToken = crypto.randomBytes(20).toString('hex');

  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.resetPasswordExpires = Date.now() + 3600000;

  await user.save();

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  console.log('========================================================');
  console.log(`Yêu cầu đặt lại mật khẩu cho email: ${email}`);
  console.log(`Link khôi phục mật khẩu (Reset Link): ${resetUrl}`);
  console.log(`Mã khôi phục (Reset Token): ${resetToken}`);
  console.log('========================================================');

  const responseData = {
    message: 'Yêu cầu khôi phục mật khẩu thành công. Vui lòng kiểm tra email của bạn (hoặc console backend để lấy link).',
  };
  
  if (process.env.NODE_ENV !== 'production') {
    responseData.resetToken = resetToken;
    responseData.resetUrl = resetUrl;
    responseData.debugInfo = 'Chế độ DEVELOPMENT: Trả về link reset trực tiếp trong phản hồi API.';
  }

  res.status(200).json(responseData);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (typeof password !== 'string' || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new ApiError(400, 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số');
  }

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user || user.isDeleted === true) {
    throw new ApiError(400, 'Mã khôi phục mật khẩu không hợp lệ hoặc đã hết hạn');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.status(200).json({
    message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới!',
  });
});

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };
