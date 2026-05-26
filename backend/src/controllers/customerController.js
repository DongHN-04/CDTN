const Customer = require('../models/Customer');
const User = require('../models/User');
const Order = require('../models/Order');

// Lấy danh sách khách hàng
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ isDeleted: { $ne: true } }).sort('-createdAt');
    const paidOrders = await Order.find({
      status: 'completed',
      paymentStatus: 'paid',
      $or: [
        { 'customer.phone': { $ne: '' } },
        { 'customer.email': { $ne: '' } },
      ],
    }).select('customer total createdAt');

    const enrichedCustomers = customers.map(customer => {
      const customerPhone = (customer.phone || '').trim();
      const customerEmail = (customer.email || '').trim().toLowerCase();

      const summary = paidOrders.reduce((current, order) => {
        const orderPhone = (order.customer?.phone || '').trim();
        const orderEmail = (order.customer?.email || '').trim().toLowerCase();
        const matchedByPhone = customerPhone && orderPhone && customerPhone === orderPhone;
        const matchedByEmail = customerEmail && orderEmail && customerEmail === orderEmail;

        if (!matchedByPhone && !matchedByEmail) return current;

        return {
          totalOrders: current.totalOrders + 1,
          totalSpent: current.totalSpent + Number(order.total || 0),
          lastPurchase: !current.lastPurchase || order.createdAt > current.lastPurchase
            ? order.createdAt
            : current.lastPurchase,
        };
      }, { totalOrders: 0, totalSpent: 0, lastPurchase: null });

      return {
        ...customer.toObject(),
        ...summary,
      };
    });

    res.json(enrichedCustomers);
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
    const customer = await Customer.create({ name, phone, email, type, notes, isActive: true, isDeleted: false });
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
    if (req.body.isActive !== undefined) customer.isActive = req.body.isActive;
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

    const orderFilter = { $or: [] };
    if (customer.phone) orderFilter.$or.push({ 'customer.phone': customer.phone });
    if (customer.email) orderFilter.$or.push({ 'customer.email': customer.email });
    const orderCount = orderFilter.$or.length ? await Order.countDocuments(orderFilter) : 0;

    if (orderCount > 0) {
      customer.isActive = false;
      customer.isDeleted = true;
      await customer.save();

      const linkedUser = customer.email ? await User.findOne({ email: customer.email, role: 'customer' }) : null;
      if (linkedUser) {
        linkedUser.isDeleted = true;
        await linkedUser.save();
      }

      return res.json({
        message: 'Khách hàng đã có đơn hàng nên đã được ẩn/ngừng hoạt động thay vì xóa vĩnh viễn',
        mode: 'soft-deleted',
      });
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
    res.json({ message: 'Đã xóa khách hàng và tài khoản liên kết (nếu có)', mode: 'hard-deleted' });
  } catch (error) {
    console.error('Lỗi khi xóa khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa khách hàng' });
  }
};

module.exports = { getCustomers, createCustomer, updateCustomer, deleteCustomer };
