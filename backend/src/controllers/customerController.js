const Customer = require('../models/Customer');
const User = require('../models/User');
const Order = require('../models/Order');

const buildDuplicateCustomerFilter = ({ phone, email }, excludeId = null) => {
  const or = [];
  if (phone) or.push({ phone });
  if (email) or.push({ email: email.toLowerCase() });

  if (or.length === 0) return null;

  const filter = {
    isDeleted: { $ne: true },
    $or: or,
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  return filter;
};

const getDuplicateCustomerMessage = (duplicate, { phone, email }) => {
  if (phone && duplicate.phone === phone) return 'Số điện thoại đã thuộc về khách hàng khác';
  if (email && duplicate.email?.toLowerCase() === email.toLowerCase()) return 'Email đã thuộc về khách hàng khác';
  return 'Khách hàng đã tồn tại';
};

const buildDuplicateUserFilter = ({ phone, email }) => {
  const or = [];
  if (phone) or.push({ phone });
  if (email) or.push({ email: email.toLowerCase() });
  if (or.length === 0) return null;
  return { isDeleted: { $ne: true }, $or: or };
};

const isLinkedCustomerUser = (user, customer) => (
  user?.role === 'customer' &&
  customer?.email &&
  user.email?.toLowerCase() === customer.email.toLowerCase()
);

const getDuplicateUserMessage = (duplicate, { phone, email }) => {
  if (phone && duplicate.phone === phone) return 'Số điện thoại đã tồn tại trong tài khoản khác';
  if (email && duplicate.email?.toLowerCase() === email.toLowerCase()) return 'Email đã tồn tại trong tài khoản khác';
  return 'Email hoặc số điện thoại đã tồn tại trong tài khoản khác';
};

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

    // Dữ liệu cũ có thể còn khách hàng trùng phone/email.
    // Chỉ hồ sơ tạo sớm nhất được giữ quyền nhận thống kê cho mỗi định danh để tránh nhân đôi số đơn/chi tiêu.
    const sortedCustomers = [...customers].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const emailOwnerMap = new Map();
    const phoneOwnerMap = new Map();

    sortedCustomers.forEach(customer => {
      const phone = (customer.phone || '').trim();
      const email = (customer.email || '').trim().toLowerCase();
      const customerId = customer._id.toString();

      if (phone && !phoneOwnerMap.has(phone)) phoneOwnerMap.set(phone, customerId);
      if (email && !emailOwnerMap.has(email)) emailOwnerMap.set(email, customerId);
    });

    const summaryByCustomer = new Map(customers.map(customer => [
      customer._id.toString(),
      { totalOrders: 0, totalSpent: 0, lastPurchase: null },
    ]));

    paidOrders.forEach(order => {
      const orderPhone = (order.customer?.phone || '').trim();
      const orderEmail = (order.customer?.email || '').trim().toLowerCase();
      const ownerId = (orderEmail && emailOwnerMap.get(orderEmail)) || (orderPhone && phoneOwnerMap.get(orderPhone));

      if (!ownerId || !summaryByCustomer.has(ownerId)) return;

      const summary = summaryByCustomer.get(ownerId);
      summary.totalOrders += 1;
      summary.totalSpent += Number(order.total || 0);
      summary.lastPurchase = !summary.lastPurchase || order.createdAt > summary.lastPurchase
        ? order.createdAt
        : summary.lastPurchase;
    });

    const enrichedCustomers = customers.map(customer => ({
      ...customer.toObject(),
      ...summaryByCustomer.get(customer._id.toString()),
    }));

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

    // Không cho tạo nhiều hồ sơ khách hàng dùng chung phone/email,
    // vì thống kê tổng đơn/chi tiêu đang ghép đơn theo các định danh này.
    const duplicateFilter = buildDuplicateCustomerFilter({ phone, email });
    const duplicate = duplicateFilter ? await Customer.findOne(duplicateFilter) : null;
    if (duplicate) {
      return res.status(400).json({ message: getDuplicateCustomerMessage(duplicate, { phone, email }) });
    }

    const duplicateUserFilter = buildDuplicateUserFilter({ phone, email });
    const duplicateUser = duplicateUserFilter ? await User.findOne(duplicateUserFilter) : null;
    if (duplicateUser) {
      return res.status(400).json({ message: getDuplicateUserMessage(duplicateUser, { phone, email }) });
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

    const nextPhone = req.body.phone ?? customer.phone;
    const nextEmail = req.body.email ?? customer.email;
    const duplicateFilter = buildDuplicateCustomerFilter({ phone: nextPhone, email: nextEmail }, customer._id);
    const duplicate = duplicateFilter ? await Customer.findOne(duplicateFilter) : null;
    if (duplicate) {
      return res.status(400).json({ message: getDuplicateCustomerMessage(duplicate, { phone: nextPhone, email: nextEmail }) });
    }

    const duplicateUserFilter = buildDuplicateUserFilter({ phone: nextPhone, email: nextEmail });
    const duplicateUser = duplicateUserFilter ? await User.findOne(duplicateUserFilter) : null;
    if (duplicateUser && !isLinkedCustomerUser(duplicateUser, customer)) {
      return res.status(400).json({ message: getDuplicateUserMessage(duplicateUser, { phone: nextPhone, email: nextEmail }) });
    }

    customer.name = req.body.name || customer.name;
    customer.phone = nextPhone;
    customer.email = nextEmail;
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
