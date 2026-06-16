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

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  user.resetPasswordExpires = Date.now() + 3600000;

  await user.save();

  console.log('========================================================');
  console.log(`Yêu cầu đặt lại mật khẩu cho email: ${email}`);
  console.log(`Mã khôi phục OTP: ${otp}`);
  console.log('========================================================');

  const responseData = {
    message: 'Yêu cầu khôi phục mật khẩu thành công. Hệ thống đã tạo mã OTP cho bạn.',
  };
  
  if (process.env.NODE_ENV !== 'production') {
    responseData.resetToken = otp; // Gửi mã OTP về Frontend trong chế độ DEV
    responseData.debugInfo = 'Chế độ DEVELOPMENT: Trả về mã OTP trực tiếp trong phản hồi API.';
  }

  res.status(200).json(responseData);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  if (typeof password !== 'string' || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new ApiError(400, 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số');
  }

  if (!otp || typeof otp !== 'string') {
    throw new ApiError(400, 'Vui lòng cung cấp mã OTP');
  }

  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  const user = await User.findOne({
    email,
    resetPasswordToken: hashedOTP,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user || user.isDeleted === true) {
    throw new ApiError(400, 'Mã OTP không hợp lệ hoặc đã hết hạn');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.status(200).json({
    message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới!',
  });
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, 'Vui lòng cung cấp email và mã OTP');
  }

  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  const user = await User.findOne({
    email,
    resetPasswordToken: hashedOTP,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user || user.isDeleted === true) {
    throw new ApiError(400, 'Mã OTP không hợp lệ hoặc đã hết hạn');
  }

  res.status(200).json({ message: 'Mã OTP hợp lệ', valid: true });
});

module.exports = { registerUser, loginUser, forgotPassword, verifyOTP, resetPassword };
