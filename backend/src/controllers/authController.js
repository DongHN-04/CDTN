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
  token: generateToken(user._id, user.role),
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(409, 'Email đã tồn tại');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    role: 'customer',
  });

  const customer = await Customer.findOne({ email });
  if (customer) {
    customer.name = name || customer.name;
    customer.phone = phone || customer.phone;
    await customer.save();
  } else {
    await Customer.create({
      name,
      email,
      phone: phone || '',
      type: 'Thường',
      notes: '',
    });
  }

  res.status(201).json(buildAuthResponse(user));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Email hoặc mật khẩu không đúng');
  }

  res.json(buildAuthResponse(user));
});

module.exports = { registerUser, loginUser };
