const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'staff', 'customer'],
      default: 'customer',
    },

    position: {
      type: String,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
      default: '',
    },

    salary: {
      type: Number, 
    },
    status: {
      type: String,
      enum: ['Đang làm việc', 'Đang nghỉ phép', 'Đã nghỉ việc'],
      default: 'Đang làm việc',
    },
  },
  {
    timestamps: true,
  }
);

// Middleware mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function () {
  // Nếu password không thay đổi, bỏ qua
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Phương thức so sánh mật khẩu
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
