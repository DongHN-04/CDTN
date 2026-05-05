const Customer = require('../models/Customer');
const User = require('../models/User');

// Lấy danh sách khách hàng
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({}).sort('-createdAt');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách khách hàng' });
  }
};

// Tạo khách hàng mới
const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, type, notes } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Tên khách hàng là bắt buộc' });
    }
    const customer = await Customer.create({ name, phone, email, type, notes });
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
  }
};

// Cập nhật thông tin khách hàng
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }
    customer.name = req.body.name || customer.name;
    customer.phone = req.body.phone ?? customer.phone;
    customer.email = req.body.email ?? customer.email;
    customer.type = req.body.type || customer.type;
    customer.notes = req.body.notes ?? customer.notes;
    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: 'Cập nhật thất bại' });
  }
};

// Xóa khách hàng (chỉ Admin)
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }

    // Kiểm tra xem có tài khoản User nào trùng email với khách hàng này không
    const user = await User.findOne({ email: customer.email });
    if (user) {
      // Chỉ xóa User nếu role là 'customer' (tránh xóa nhầm admin/staff)
      if (user.role === 'customer') {
        await User.findByIdAndDelete(user._id);
        console.log(`Đã xóa tài khoản user ${user.email} (role: customer)`);
      } else {
        console.log(`Không xóa user ${user.email} vì role là ${user.role}`);
      }
    }

    // Xóa khách hàng
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa khách hàng và tài khoản liên kết (nếu có)' });
  } catch (error) {
    console.error('Lỗi khi xóa khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa khách hàng' });
  }
};

module.exports = { getCustomers, createCustomer, updateCustomer, deleteCustomer };