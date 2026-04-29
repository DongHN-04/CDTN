const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Kiểm tra xem đã có admin chưa
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      // Tạo admin mặc định
      await User.create({
        name: 'Admin',
        email: 'admin@gmail.com',
        password: '123456',
        role: 'admin',
      });
      console.log('✅ Tài khoản admin mặc định đã được tạo: admin@gmail.com / 123456');
    } else {
      console.log('✅ Admin đã tồn tại, không cần tạo mới.');
    }
  } catch (error) {
    console.error('❌ Lỗi khi seed admin:', error.message);
  }
};

module.exports = seedAdmin;