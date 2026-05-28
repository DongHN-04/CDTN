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

  // Đăng ký khách hàng mới phải dùng email/phone chưa tồn tại trong toàn hệ thống,
  // tránh tạo tài khoản mới gắn vào hồ sơ khách hàng cũ và làm sai thống kê khách hàng.
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

module.exports = { registerUser, loginUser };
