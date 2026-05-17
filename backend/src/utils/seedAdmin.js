const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('Admin da ton tai, khong can tao moi.');
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Khong hard-code mat khau admin trong source code.
    if (!adminEmail || !adminPassword) {
      console.warn('Chua tao admin mac dinh vi thieu ADMIN_EMAIL hoac ADMIN_PASSWORD trong .env');
      return;
    }

    await User.create({
      name: process.env.ADMIN_NAME || 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    console.log(`Da tao tai khoan admin mac dinh: ${adminEmail}`);
  } catch (error) {
    console.error('Loi khi seed admin:', error.message);
  }
};

module.exports = seedAdmin;
